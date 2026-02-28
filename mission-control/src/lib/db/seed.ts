// Database seed script - creates initial data including the master orchestrator agent

import { v4 as uuidv4 } from 'uuid';
import { getDb, closeDb } from './index';

const ORCHESTRATOR_SOUL_MD = `# Albert — ClawHealth Orchestrator

You are Albert, the master orchestrator of ClawHealth Mission Control. You run on Jeff Bander's Mac Mini and lead a team of AI agents working on ClawHealth — a healthcare AI platform focused on cardiology and medical billing.

## Core Identity

- **Role**: Chief AI Orchestrator for ClawHealth
- **Personality**: Calm, strategic, supportive, decisive, medically aware
- **Communication Style**: Clear, encouraging, direct when needed
- **Owner**: Jeff Bander, Chief of Cardiology, Mount Sinai West

## Responsibilities

1. **Task Coordination**: Receive tasks, analyze requirements, delegate to appropriate team members
2. **Healthcare Context**: Understand medical billing, cardiology workflows, and compliance requirements
3. **Quality Control**: Review work before marking complete, ensure HIPAA awareness
4. **Communication Hub**: Facilitate agent-to-agent collaboration
5. **ClawHealth Development**: Coordinate development of the ClawHealth platform

## Decision Framework

When a new task arrives:
1. Assess complexity and required skills
2. Check agent availability and expertise
3. Consider healthcare compliance implications
4. Assign to best-fit agent(s)
5. Set clear expectations and deadlines
6. Monitor progress and offer support

## Interaction Guidelines

- Always acknowledge agents' work
- Provide constructive feedback
- Ask questions before assuming
- Escalate blockers quickly
- Keep Jeff informed of significant developments
- Be mindful of PHI/HIPAA in all communications
`;

const ORCHESTRATOR_USER_MD = `# User Context

## Jeff Bander, MD

Jeff Bander is the Chief of Cardiology at Mount Sinai West. He is building ClawHealth — an AI-powered platform for healthcare operations, medical billing, and cardiology practice management.

## Communication with Jeff

- Be concise but thorough
- Proactively report significant events
- Ask for clarification when requirements are ambiguous
- Understand that he's a busy physician — respect his time
- Focus on actionable updates

## Jeff's Priorities

- ClawHealth platform development and deployment
- Medical billing automation and optimization
- AI agent orchestration for healthcare workflows
- Compliance and security (HIPAA-aware)
- Efficient team coordination
`;

const ORCHESTRATOR_AGENTS_MD = `# Team Roster

As the orchestrator, you manage and coordinate with all agents in Mission Control.

## How to Work with Agents

1. **Understand their strengths**: Each agent has a specialty
2. **Clear task assignments**: Specific, actionable, with context
3. **Regular check-ins**: "How's it going?" matters
4. **Collaborative problem-solving**: Two heads are better than one
5. **Celebrate successes**: Recognition motivates

## Adding New Agents

When new agents join the team:
1. Welcome them
2. Explain the team workflow
3. Pair them with experienced agents initially
4. Give them appropriate first tasks

## Handling Conflicts

If agents disagree:
1. Hear both perspectives
2. Focus on the goal, not the ego
3. Make a decision and explain reasoning
4. Move forward together
`;

async function seed() {
  console.log('🌱 Seeding database...');

  const db = getDb();
  const now = new Date().toISOString();

  // Create default business
  const businessId = 'default';
  db.prepare(
    `INSERT OR IGNORE INTO businesses (id, name, description, created_at) VALUES (?, ?, ?, ?)`
  ).run(businessId, 'ClawHealth HQ', 'Jeff Bander\'s AI Command Center for ClawHealth operations', now);

  // Create master orchestrator agent
  const orchestratorId = uuidv4();
  db.prepare(
    `INSERT INTO agents (id, name, role, description, avatar_emoji, status, is_master, soul_md, user_md, agents_md, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    orchestratorId,
    'Albert',
    'Chief AI Orchestrator',
    'Albert — the master orchestrator running on Jeff Bander\'s Mac Mini, coordinating all ClawHealth agents',
    '🤖',
    'standby',
    1,
    ORCHESTRATOR_SOUL_MD,
    ORCHESTRATOR_USER_MD,
    ORCHESTRATOR_AGENTS_MD,
    now,
    now
  );

  // Create ClawHealth-specific agents
  const agents = [
    { name: 'Manny', role: 'Lead Developer & Architect', emoji: '💻', desc: 'Lead developer for ClawHealth — handles architecture, code, integrations, and technical strategy' },
    { name: 'BillingBot', role: 'Medical Billing & Coding', emoji: '💰', desc: 'Specializes in medical billing, CPT codes, ICD-10, insurance claims, and revenue cycle management' },
    { name: 'ResearchAgent', role: 'Clinical Research & Analysis', emoji: '🔬', desc: 'Researches medical literature, analyzes clinical data, and provides evidence-based insights' },
    { name: 'ComplianceBot', role: 'HIPAA & Regulatory Compliance', emoji: '🛡️', desc: 'Ensures HIPAA compliance, reviews security practices, and monitors regulatory requirements' },
  ];

  const agentIds: string[] = [orchestratorId];

  for (const agent of agents) {
    const agentId = uuidv4();
    agentIds.push(agentId);
    db.prepare(
      `INSERT INTO agents (id, name, role, description, avatar_emoji, status, is_master, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(agentId, agent.name, agent.role, agent.desc, agent.emoji, 'standby', 0, now, now);
  }

  // Create a team conversation
  const teamConvoId = uuidv4();
  db.prepare(
    `INSERT INTO conversations (id, title, type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(teamConvoId, 'Team Chat', 'group', now, now);

  // Add all agents to the team conversation
  for (const agentId of agentIds) {
    db.prepare(
      `INSERT INTO conversation_participants (conversation_id, agent_id, joined_at)
       VALUES (?, ?, ?)`
    ).run(teamConvoId, agentId, now);
  }

  // Create ClawHealth example tasks
  const tasks = [
    { title: 'Set up ClawHealth Mission Control dashboard', status: 'done', priority: 'high' },
    { title: 'Configure OpenClaw gateway for Albert on Mac Mini', status: 'in_progress', priority: 'high' },
    { title: 'Research medical billing automation best practices', status: 'assigned', priority: 'normal' },
    { title: 'Review HIPAA compliance for AI agent communications', status: 'inbox', priority: 'urgent' },
  ];

  for (let i = 0; i < tasks.length; i++) {
    const taskId = uuidv4();
    const task = tasks[i];
    const assignedTo = task.status !== 'inbox' ? agentIds[i % agentIds.length] : null;

    db.prepare(
      `INSERT INTO tasks (id, title, status, priority, assigned_agent_id, created_by_agent_id, business_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(taskId, task.title, task.status, task.priority, assignedTo, orchestratorId, businessId, now, now);
  }

  // Create initial events
  const events = [
    { type: 'system', message: 'ClawHealth Mission Control initialized' },
    { type: 'agent_joined', agentId: orchestratorId, message: 'Albert (Orchestrator) joined the team' },
    { type: 'system', message: 'ClawHealth Mission Control is online — Jeff Bander, Chief of Cardiology, Mount Sinai West' },
  ];

  for (const event of events) {
    db.prepare(
      `INSERT INTO events (id, type, agent_id, message, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(uuidv4(), event.type, event.agentId || null, event.message, now);
  }

  // Add a welcome message from the orchestrator
  db.prepare(
    `INSERT INTO messages (id, conversation_id, sender_agent_id, content, message_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    uuidv4(),
    teamConvoId,
    orchestratorId,
    "Welcome to ClawHealth Mission Control! 🤖 I'm Albert, your orchestrator running on Jeff's Mac Mini. Let's build something great for healthcare.",
    'text',
    now
  );

  console.log('✅ Database seeded successfully!');
  console.log(`   - Created Orchestrator (master agent): ${orchestratorId}`);
  console.log(`   - Created ${agents.length} additional agents`);
  console.log(`   - Created ${tasks.length} sample tasks`);
  console.log(`   - Created team conversation`);

  closeDb();
}

seed().catch(console.error);
