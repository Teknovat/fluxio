import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seed...');

    // Hash password using bcrypt (salt rounds = 10)
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Create default tenant
    const defaultTenant = await prisma.tenant.upsert({
        where: { slug: 'default' },
        update: {},
        create: {
            name: 'Default Company',
            slug: 'default',
            active: true,
        },
    });

    console.log('✓ Created default tenant:', defaultTenant.name);

    // Create default admin user
    const admin = await prisma.user.upsert({
        where: {
            tenantId_email: {
                tenantId: defaultTenant.id,
                email: 'admin@fluxio.com',
            },
        },
        update: {},
        create: {
            tenantId: defaultTenant.id,
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
                tenantId: defaultTenant.id,
                name: intervenant.name,
                type: intervenant.type,
                active: true,
            },
        });
    }

    console.log(`✓ Created ${sampleIntervenants.length} sample intervenants`);

    // Optional: Add sample mouvements for testing
    const sampleMouvements = [
        {
            tenantId: defaultTenant.id,
            date: new Date('2024-01-15'),
            intervenantId: 'seed-client-abc',
            type: 'ENTREE',
            amount: 5000,
            reference: 'FAC-001',
            modality: 'VIREMENT',
            note: 'Paiement facture janvier',
        },
        {
            tenantId: defaultTenant.id,
            date: new Date('2024-01-20'),
            intervenantId: 'seed-fournisseur-xyz',
            type: 'SORTIE',
            amount: 2500,
            reference: 'ACH-001',
            modality: 'CHEQUE',
            note: 'Achat matériel',
        },
        {
            tenantId: defaultTenant.id,
            date: new Date('2024-01-25'),
            intervenantId: 'seed-associé-jean-dupont',
            type: 'SORTIE',
            amount: 3000,
            reference: 'SAL-001',
            modality: 'SALAIRE',
            note: 'Salaire janvier',
        },
        {
            tenantId: defaultTenant.id,
            date: new Date('2024-02-01'),
            intervenantId: 'seed-caisse-espèces',
            type: 'ENTREE',
            amount: 1200,
            modality: 'ESPECES',
            note: 'Vente comptant',
        },
        {
            tenantId: defaultTenant.id,
            date: new Date('2024-02-05'),
            intervenantId: 'seed-fournisseur-xyz',
            type: 'SORTIE',
            amount: 800,
            modality: 'STOCK',
            note: 'Achat stock',
        },
    ];

    for (const mouvement of sampleMouvements) {
        await prisma.mouvement.create({
            data: mouvement,
        });
    }

    console.log(`✓ Created ${sampleMouvements.length} sample mouvements`);
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
