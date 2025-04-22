# @simoesmario/strapi-provider-upload-azure-storage

Custom Azure Blob Storage upload provider for Strapi, created by @simoesmario


## Installation

```bash
npm install @simoesmario/strapi-provider-upload-azure-storage
```

## Configuration
In config/plugins.js:

```js
module.exports = ({ env }) => ({
    upload: {
        config: {
            provider: "@simoesmario/strapi-provider-upload-azure-storage",
            providerOptions: {
                account: env("STORAGE_ACCOUNT"),
                accountKey: env("STORAGE_ACCOUNT_KEY"),
                serviceBaseURL: env("STORAGE_URL"),
                containerName: env("STORAGE_CONTAINER_NAME"),
                cdnBaseURL: env("STORAGE_CDN_URL"),
                defaultPath: "assets",
                maxConcurrent: 10,
            },
        },
    },
    ...
});
```

In config/middlewares.js:

```js
module.exports = [
    "strapi::security",
    {
        name: "strapi::security",
        config: {
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
            "img-src": [
                "'self'",
                "data:",
                "blob:",
                "https://market-assets.strapi.io",
                process.env.STORAGE_CDN_URL, 
            ],
            },
        },
        },
    },
    ...
];
```