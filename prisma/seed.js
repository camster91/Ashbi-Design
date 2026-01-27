// Database seed script

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'cameron@agencyhub.com' },
    update: {},
    create: {
      email: 'cameron@agencyhub.com',
      name: 'Cameron',
      password: hashPassword('admin123'),
      role: 'ADMIN',
      skills: JSON.stringify(['management', 'design', 'development']),
      capacity: 100
    }
  });
  console.log('Created admin:', admin.email);

  // Create team members
  const developer = await prisma.user.upsert({
    where: { email: 'dev@agencyhub.com' },
    update: {},
    create: {
      email: 'dev@agencyhub.com',
      name: 'Alex Developer',
      password: hashPassword('team123'),
      role: 'TEAM',
      skills: JSON.stringify(['development', 'technical', 'debugging']),
      capacity: 100
    }
  });
  console.log('Created team member:', developer.email);

  const designer = await prisma.user.upsert({
    where: { email: 'design@agencyhub.com' },
    update: {},
    create: {
      email: 'design@agencyhub.com',
      name: 'Sam Designer',
      password: hashPassword('team123'),
      role: 'TEAM',
      skills: JSON.stringify(['design', 'ui', 'branding']),
      capacity: 100
    }
  });
  console.log('Created team member:', designer.email);

  // Create sample client
  const client = await prisma.client.upsert({
    where: { domain: 'acmecorp.com' },
    update: {},
    create: {
      name: 'Acme Corporation',
      domain: 'acmecorp.com',
      status: 'ACTIVE',
      communicationPrefs: JSON.stringify({
        preferredTone: 'professional',
        responseTime: 'standard'
      }),
      knowledgeBase: JSON.stringify([
        { type: 'note', content: 'Enterprise client, values quick responses' }
      ])
    }
  });
  console.log('Created client:', client.name);

  // Create contact for client
  const contact = await prisma.contact.upsert({
    where: {
      email_clientId: {
        email: 'john@acmecorp.com',
        clientId: client.id
      }
    },
    update: {},
    create: {
      email: 'john@acmecorp.com',
      name: 'John Smith',
      role: 'Project Manager',
      isPrimary: true,
      clientId: client.id
    }
  });
  console.log('Created contact:', contact.email);

  // Create sample project
  const project = await prisma.project.upsert({
    where: { id: 'sample-project-1' },
    update: {},
    create: {
      id: 'sample-project-1',
      name: 'Website Redesign',
      description: 'Complete redesign of Acme Corp marketing website',
      status: 'ACTIVE',
      health: 'ON_TRACK',
      healthScore: 85,
      aiSummary: 'Project is progressing well. Currently in design phase with positive client feedback.',
      defaultOwnerId: designer.id,
      clientId: client.id
    }
  });
  console.log('Created project:', project.name);

  // Create sample thread
  const thread = await prisma.thread.create({
    data: {
      subject: 'Homepage mockup feedback',
      status: 'AWAITING_RESPONSE',
      priority: 'NORMAL',
      intent: 'feedback',
      sentiment: 'happy',
      matchConfidence: 0.95,
      clientId: client.id,
      projectId: project.id,
      assignedToId: designer.id,
      messages: {
        create: {
          direction: 'INBOUND',
          senderEmail: 'john@acmecorp.com',
          senderName: 'John Smith',
          subject: 'Homepage mockup feedback',
          bodyText: 'Hi team,\n\nJust reviewed the homepage mockups and they look great! A few minor suggestions:\n\n1. Could we try a slightly darker shade of blue for the header?\n2. The call-to-action button seems a bit small on mobile\n3. Love the hero image selection!\n\nLet me know when we can schedule a call to discuss.\n\nBest,\nJohn',
          receivedAt: new Date()
        }
      }
    }
  });
  console.log('Created sample thread:', thread.subject);

  // Create sample tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Adjust header color per client feedback',
        description: 'Client requested darker blue shade for header',
        status: 'PENDING',
        priority: 'NORMAL',
        category: 'IMMEDIATE',
        estimatedTime: '30 minutes',
        projectId: project.id,
        assigneeId: designer.id,
        aiGenerated: true
      },
      {
        title: 'Resize CTA button for mobile',
        description: 'Increase size of call-to-action button on mobile views',
        status: 'PENDING',
        priority: 'NORMAL',
        category: 'IMMEDIATE',
        estimatedTime: '1 hour',
        projectId: project.id,
        assigneeId: developer.id,
        aiGenerated: true
      },
      {
        title: 'Schedule feedback call with client',
        description: 'Set up call to discuss mockup revisions',
        status: 'PENDING',
        priority: 'HIGH',
        category: 'IMMEDIATE',
        estimatedTime: '15 minutes',
        projectId: project.id,
        assigneeId: admin.id,
        aiGenerated: false
      }
    ]
  });
  console.log('Created sample tasks');

  // Create sample assignment rules
  await prisma.assignmentRule.createMany({
    data: [
      {
        name: 'Bug reports to developers',
        type: 'SKILL',
        conditions: JSON.stringify({ intent: 'bug_report' }),
        priority: 10,
        isActive: true
      },
      {
        name: 'Design feedback to designers',
        type: 'SKILL',
        conditions: JSON.stringify({ intent: 'feedback', keywords: ['design', 'mockup', 'ui'] }),
        priority: 10,
        isActive: true
      }
    ]
  });
  console.log('Created assignment rules');

  // Create sample templates
  await prisma.template.createMany({
    data: [
      {
        name: 'Acknowledgment',
        category: 'ACKNOWLEDGMENT',
        subject: 'Re: {{subject}}',
        body: 'Hi {{clientName}},\n\nThank you for your message. We\'ve received your request and will get back to you shortly.\n\nBest regards,\nThe Team',
        variables: JSON.stringify(['subject', 'clientName']),
        isActive: true
      },
      {
        name: 'Meeting Request',
        category: 'MEETING',
        subject: 'Meeting Request: {{topic}}',
        body: 'Hi {{clientName}},\n\nI\'d like to schedule a call to discuss {{topic}}. Would any of the following times work for you?\n\n- {{option1}}\n- {{option2}}\n- {{option3}}\n\nLooking forward to connecting!\n\nBest,\n{{senderName}}',
        variables: JSON.stringify(['clientName', 'topic', 'option1', 'option2', 'option3', 'senderName']),
        isActive: true
      }
    ]
  });
  console.log('Created templates');

  console.log('\nSeed completed successfully!');
  console.log('\nDefault login credentials:');
  console.log('  Admin: cameron@agencyhub.com / admin123');
  console.log('  Team:  dev@agencyhub.com / team123');
  console.log('  Team:  design@agencyhub.com / team123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
