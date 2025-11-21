import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seed...');

    // Hash password using bcrypt (salt rounds = 10)
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Create default admin user
    const admin = await prisma.user.upsert({
        where: { email: 'admin@fluxio.com' },
        update: {},
        create: {
            name: 'Admin',
            email: 'admin@fluxio.com',
            password: adminPassword,
            role: 'ADMIN',
            active: true,
        },
    });

    console.log('✓ Created default admin user:', admin.email);

    // Optional: Add sample intervenants for testing
    const sampleIntervenants = [
        { name: 'Client ABC', type: 'CLIENT' },
        { name: 'Fournisseur XYZ', type: 'FOURNISSEUR' },
        { name: 'Associé Jean Dupont', type: 'ASSOCIE' },
        { name: 'Banque Principale', type: 'CAISSE_BANQUE' },
        { name: 'Caisse Espèces', type: 'CAISSE_BANQUE' },
    ];

    for (const intervenant of sampleIntervenants) {
        await prisma.intervenant.upsert({
            where: { id: `seed-${intervenant.name.toLowerCase().replace(/\s+/g, '-')}` },
            update: {},
            create: {
                id: `seed-${intervenant.name.toLowerCase().replace(/\s+/g, '-')}`,
                name: intervenant.name,
                type: intervenant.type,
                active: true,
            },
        });
    }

    console.log(`✓ Created ${sampleIntervenants.length} sample intervenants`);
    console.log('\nSeed completed successfully!');
    console.log('\nDefault credentials:');
    console.log('  Email: admin@fluxio.com');
    console.log('  Password: admin123');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
