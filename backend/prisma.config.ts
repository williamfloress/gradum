import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
const pooledUrl = databaseUrl ? (databaseUrl.includes('?') ? `${databaseUrl}&sslmode=require` : `${databaseUrl}?sslmode=require`) : undefined;

export default {
    datasource: {
        url: pooledUrl,
    },
};
