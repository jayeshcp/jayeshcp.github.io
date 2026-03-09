const environment = process.env.NODE_ENV || "dev";
const PROD_ENV = "prod";
const isProd = environment === PROD_ENV;
const GTAG = process.env.GTAG || "";

export default {
  isProd,
  GTAG,
};
