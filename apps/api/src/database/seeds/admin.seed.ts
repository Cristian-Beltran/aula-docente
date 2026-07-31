import * as argon2 from 'argon2';
import dataSource from '../data-source';
import { UserEntity, UserRole } from '../../common/entities/user.entity';

async function run() {
  const email = process.env.ADMIN_SEED_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  const fullName = process.env.ADMIN_SEED_FULL_NAME ?? 'Administrador Aula Docente';
  const role = (process.env.ADMIN_SEED_ROLE as UserRole | undefined) ?? UserRole.ADMIN;

  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL y ADMIN_SEED_PASSWORD son obligatorios para ejecutar el seed.');
  }

  await dataSource.initialize();
  const repository = dataSource.getRepository(UserEntity);
  const existing = await repository.findOne({ where: { email } });
  const passwordHash = await argon2.hash(password);

  if (existing) {
    existing.fullName = fullName;
    existing.role = role;
    existing.active = true;
    existing.passwordHash = passwordHash;
    await repository.save(existing);
    console.log(`Admin actualizado: ${email}`);
  } else {
    const admin = repository.create({
      fullName,
      email,
      passwordHash,
      role,
      active: true,
    });
    await repository.save(admin);
    console.log(`Admin creado: ${email}`);
  }

  await dataSource.destroy();
}

run().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  process.exit(1);
});
