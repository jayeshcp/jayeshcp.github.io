const environment = process.env.NODE_ENV || "dev";
const PROD_ENV = "prod";
const isProd = environment === PROD_ENV;
const gtag = process.env.gtag || "";

export default {
  isProd,
  gtag,
};
