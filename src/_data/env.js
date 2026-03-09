const environment = process.env.NODE_ENV || "dev";
const PROD_ENV = "prod";
const isProd = environment === PROD_ENV;
const gtag = process.env.gtag || "";

console.log(`gtag value: ${gtag}`);

export default {
  isProd,
  gtag,
};
