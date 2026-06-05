const LOCAL_WEB_URL = 'http://localhost:5173';
// const LOCAL_WEB_URL = 'http://10.0.2.2:5173';
const PROD_WEB_URL = 'https://sidequestlive.vercel.app/';

export const WEB_APP_URL = __DEV__ ? LOCAL_WEB_URL : PROD_WEB_URL;
// export const WEB_APP_URL = LOCAL_WEB_URL;

export const APNS_ENVIRONMENT = __DEV__ ? 'sandbox' : 'production';
