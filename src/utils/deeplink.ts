import { validateProductToken } from './validation';

const args = process.argv.slice(2);

const getArg = (name: string): string | null => {
  const prefix = `--${name}=`;
  const found = args.find((a) => a.startsWith(prefix));
  return found ? found.replace(prefix, '') : null;
};

const bot = getArg('bot');
const tokenInput = getArg('token');

if (!bot || !tokenInput) {
  // eslint-disable-next-line no-console
  console.log('Usage: npm run generate:link -- --bot=<bot_username> --token=<P2026-XXXXX>');
  process.exit(1);
}

const token = validateProductToken(tokenInput);
if (!token) {
  // eslint-disable-next-line no-console
  console.error('Token formati noto‘g‘ri. P2026-XXXXX ko‘rinishida kiriting.');
  process.exit(1);
}

const link = `https://t.me/${bot}?start=${token}`;
// eslint-disable-next-line no-console
console.log(link);
