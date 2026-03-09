const environment = process.env.NODE_ENV || "dev";
const PROD_ENV = "prod";
const isProd = environment === PROD_ENV;
const GTAG = process.env.GTAG || "";

console.log(`isProd value: ${isProd}`);
console.log(`GTAG value: ${GTAG}`);

export default {
  isProd,
  GTAG,
};
