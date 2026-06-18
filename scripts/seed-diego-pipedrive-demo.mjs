import 'dotenv/config';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const FALLBACK_ENV_FILE = '.env.vercel.tmp';
const ORG_NAME = 'Danilo';
const OWNER_EMAIL = 'dorettodi@gmail.com';
const BOARD_KEY = 'diego-doretto-pipedrive';
const BOARD_NAME = 'Diego Doretto';
const SEED_MARKER = 'Seed Pipedrive Diego Doretto - 2026-06-16';

const stages = [
  'PRIMEIRO CONTATO',
  'QUALIFICADO',
  'PROPOSTA ENVIADA',
  'EM NEGOCIAÇÃO',
  'PRIMEIRO PEDIDO',
  'ATIVO',
  'INATIVO',
  'NAO TEM INTERESSE',
];

const rows = [
  { company: 'TERRAÇO ITALIA', contact: 'LEONARDO', phone: '11 97032-8884' },
  { company: 'GREEN JOY', contact: 'FERNANDO', phone: '(11) 96921-6052' },
  { company: 'BOTECOTERAPIA', contact: 'VINICIUS', phone: '(11) 95444-5278' },
  { company: 'RECANTO ITAIM', contact: null, phone: '(11) 98607-4176' },
  { company: 'ELEA FORNERIA', contact: null, phone: '(11) 2667-2368' },
  { company: 'PÃO COM CARNE', contact: null, phone: '(11) 5084-2412' },
  { company: 'DIVINOS PINHEIROS', contact: null, phone: '(11) 91528-7939' },
  { company: 'BUZINA BURGUES', contact: null, phone: '(11) 98845-7550' },
  { company: 'NOAH GASTRONOMIA', contact: null, email: 'ariribeiro@noah.com.br', phone: '(11) 3147-7038' },
  { company: 'TOKUN FOME', contact: null, phone: '(11) 95154-5948' },
  { company: 'BAR DOS CRAVOS', contact: null, phone: '(11) 99787-0227' },
  { company: 'CANTINHO MINEIRO', contact: 'FRANCISCO', phone: '(11) 99191-8659' },
  { company: 'GIULIETTA CARNI', contact: null, phone: '(11) 3368-6863' },
];

function loadFallbackEnv() {
  if (!fs.existsSync(FALLBACK_ENV_FILE)) return;

  for (const line of fs.readFileSync(FALLBACK_ENV_FILE, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;

    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function supabaseAdmin() {
  loadFallbackEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

async function maybeSingle(query, label) {
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function resolveOrgAndOwner(sb) {
  const org = await maybeSingle(
    sb.from('organizations').select('id, name').eq('name', ORG_NAME).limit(1),
    'select organization'
  );
  if (!org) throw new Error(`Organization not found: ${ORG_NAME}`);

  const owner = await maybeSingle(
    sb.from('profiles').select('id, email, organization_id').eq('email', OWNER_EMAIL).limit(1),
    'select owner profile'
  );
  if (!owner) throw new Error(`Profile not found: ${OWNER_EMAIL}`);
  if (owner.organization_id !== org.id) {
    throw new Error(`${OWNER_EMAIL} does not belong to organization ${ORG_NAME}`);
  }

  return { org, owner };
}

async function ensureBoard(sb, orgId, ownerId) {
  let board = await maybeSingle(
    sb.from('boards').select('*').eq('organization_id', orgId).eq('key', BOARD_KEY).is('deleted_at', null),
    'select board'
  );

  const payload = {
    organization_id: orgId,
    owner_id: ownerId,
    key: BOARD_KEY,
    name: BOARD_NAME,
    description: 'Funil replicado do teste no Pipedrive',
    type: 'SALES',
    position: 0,
    is_default: false,
    template: 'pipedrive-demo',
    updated_at: new Date().toISOString(),
  };

  if (board) {
    const { data, error } = await sb.from('boards').update(payload).eq('id', board.id).select('*').single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await sb.from('boards').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

async function ensureStages(sb, boardId, orgId) {
  const { data: existing, error } = await sb
    .from('board_stages')
    .select('*')
    .eq('board_id', boardId)
    .order('order', { ascending: true });
  if (error) throw error;

  const byName = new Map((existing || []).map((stage) => [stage.name.toUpperCase(), stage]));
  const byOrder = new Map((existing || []).map((stage) => [stage.order, stage]));
  const result = [];

  for (let index = 0; index < stages.length; index += 1) {
    const name = stages[index];
    const existingStage = byName.get(name) || byOrder.get(index);
    const payload = {
      board_id: boardId,
      organization_id: orgId,
      name,
      label: name,
      color: index === 7 ? 'bg-red-500' : index >= 5 ? 'bg-slate-500' : 'bg-blue-500',
      order: index,
      is_default: index === 0,
    };

    if (existingStage) {
      const { data, error: updateError } = await sb
        .from('board_stages')
        .update(payload)
        .eq('id', existingStage.id)
        .select('*')
        .single();
      if (updateError) throw updateError;
      result.push(data);
      continue;
    }

    const { data, error: insertError } = await sb.from('board_stages').insert(payload).select('*').single();
    if (insertError) throw insertError;
    result.push(data);
  }

  return result.sort((a, b) => a.order - b.order);
}

async function ensureCompany(sb, orgId, ownerId, name) {
  const company = await maybeSingle(
    sb.from('crm_companies').select('*').eq('organization_id', orgId).ilike('name', name).is('deleted_at', null).limit(1),
    `select company ${name}`
  );
  if (company) return company;

  const { data, error } = await sb
    .from('crm_companies')
    .insert({
      organization_id: orgId,
      owner_id: ownerId,
      name,
      industry: 'Restaurante',
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function ensureContact(sb, orgId, ownerId, row, company) {
  const displayName = row.contact || row.company;
  let contact = null;

  if (row.phone) {
    contact = await maybeSingle(
      sb.from('contacts').select('*').eq('organization_id', orgId).eq('phone', row.phone).is('deleted_at', null).limit(1),
      `select contact phone ${row.phone}`
    );
  }

  if (!contact) {
    contact = await maybeSingle(
      sb
        .from('contacts')
        .select('*')
        .eq('organization_id', orgId)
        .eq('client_company_id', company.id)
        .ilike('name', displayName)
        .is('deleted_at', null)
        .limit(1),
      `select contact ${displayName}`
    );
  }

  const payload = {
    organization_id: orgId,
    owner_id: ownerId,
    name: displayName,
    email: row.email || null,
    phone: row.phone || null,
    company_name: row.company,
    client_company_id: company.id,
    status: 'ACTIVE',
    stage: 'LEAD',
    source: 'Pipedrive teste',
    notes: SEED_MARKER,
    updated_at: new Date().toISOString(),
  };

  if (contact) {
    const { data, error } = await sb.from('contacts').update(payload).eq('id', contact.id).select('*').single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await sb.from('contacts').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

async function ensureDeal(sb, orgId, ownerId, board, stage, company, contact) {
  const existingDeal = await maybeSingle(
    sb
      .from('deals')
      .select('*')
      .eq('organization_id', orgId)
      .eq('board_id', board.id)
      .ilike('title', 'TERRAÇO ITALIA')
      .is('deleted_at', null)
      .limit(1),
    'select deal TERRAÇO ITALIA'
  );

  const payload = {
    organization_id: orgId,
    owner_id: ownerId,
    title: 'TERRAÇO ITALIA',
    value: 0,
    probability: 0,
    status: 'open',
    priority: 'medium',
    board_id: board.id,
    stage_id: stage.id,
    contact_id: contact.id,
    client_company_id: company.id,
    is_won: false,
    is_lost: false,
    custom_fields: { source: 'pipedrive_demo_diego', seeded_at: '2026-06-16' },
    tags: ['pipedrive-teste'],
    updated_at: new Date().toISOString(),
  };

  if (existingDeal) {
    const { data, error } = await sb.from('deals').update(payload).eq('id', existingDeal.id).select('*').single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await sb.from('deals').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

async function main() {
  const sb = supabaseAdmin();
  const { org, owner } = await resolveOrgAndOwner(sb);
  const board = await ensureBoard(sb, org.id, owner.id);
  const stageRows = await ensureStages(sb, board.id, org.id);

  const companyMap = new Map();
  const contactMap = new Map();
  for (const row of rows) {
    const company = await ensureCompany(sb, org.id, owner.id, row.company);
    const contact = await ensureContact(sb, org.id, owner.id, row, company);
    companyMap.set(row.company, company);
    contactMap.set(row.company, contact);
  }

  const terraceDeal = await ensureDeal(
    sb,
    org.id,
    owner.id,
    board,
    stageRows[0],
    companyMap.get('TERRAÇO ITALIA'),
    contactMap.get('TERRAÇO ITALIA')
  );

  await sb.from('activities').delete().eq('organization_id', org.id).eq('description', SEED_MARKER);

  const now = new Date();
  const activities = rows.map((row, index) => {
    const company = companyMap.get(row.company);
    const contact = contactMap.get(row.company);
    return {
      organization_id: org.id,
      owner_id: owner.id,
      title: 'Chamada',
      description: SEED_MARKER,
      type: 'CALL',
      date: new Date(now.getTime() + (index + 1) * 60 * 60 * 1000).toISOString(),
      completed: false,
      deal_id: row.company === 'TERRAÇO ITALIA' ? terraceDeal.id : null,
      contact_id: contact.id,
      client_company_id: company.id,
      participant_contact_ids: [contact.id],
    };
  });

  const { error: activitiesError } = await sb.from('activities').insert(activities);
  if (activitiesError) throw activitiesError;

  const { error: settingsError } = await sb
    .from('user_settings')
    .upsert(
      {
        user_id: owner.id,
        active_board_id: board.id,
        default_route: '/boards',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  if (settingsError) throw settingsError;

  console.log(
    JSON.stringify(
      {
        board: board.name,
        board_id: board.id,
        owner: owner.email,
        stages: stageRows.map((stage) => stage.name),
        deal: terraceDeal.title,
        visible_companies_seeded: rows.length,
        activities_seeded: activities.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
