const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");
const path = require("path");

// console.log("[Azure Provider] INIT");

module.exports = {
  init(providerOptions) {
    const {
      account, // Nom du compte Azure
      accountKey, // Clé d'accès du compte Azure
      serviceBaseURL, // URL du service (ex: https://<account>.blob.core.windows.net)
      containerName, // Nom du container Blob à utiliser
      cdnBaseURL, // URL de base du CDN (si utilisé)
      defaultPath = "", // Chemin par défaut à préfixer sur tous les fichiers (ex: "assets/")
      maxConcurrent = 10, // Nombre max de connexions concurrentes pour l'upload en stream
    } = providerOptions;

    // Création de l'objet d'authentification avec les identifiants du compte
    const sharedKeyCredential = new StorageSharedKeyCredential(
      account,
      accountKey
    );

    // Création du client principal pour interagir avec Azure Blob Storage
    const blobServiceClient = new BlobServiceClient(
      serviceBaseURL,
      sharedKeyCredential
    );

    // Récupération du client spécifique au container cible
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const getPath = (file) =>
      path.posix.join(defaultPath, `${file.hash}${file.ext}`);

    return {
      // Upload via `file.buffer` (petits fichiers)
      async upload(file) {
        const filePath = getPath(file);
        const blockBlobClient = containerClient.getBlockBlobClient(filePath);

        // Upload du fichier dans Azure Blob
        await blockBlobClient.uploadData(file.buffer, {
          blobHTTPHeaders: { blobContentType: file.mime },
        });

        // Définition de l'URL du fichier
        file.url = cdnBaseURL
          ? `${cdnBaseURL}/${containerName}/${filePath}`
          : blockBlobClient.url;
      },

      // Upload via stream (fichiers volumineux)
      async uploadStream(file) {
        const filePath = getPath(file);
        const blockBlobClient = containerClient.getBlockBlobClient(filePath);

        await blockBlobClient.uploadStream(
          file.stream,
          undefined, // bufferSize: 4 * 1024 * 1024, // 4MB
          maxConcurrent,
          {
            blobHTTPHeaders: { blobContentType: file.mime },
          }
        );

        file.url = cdnBaseURL
          ? `${cdnBaseURL}/${containerName}/${filePath}`
          : blockBlobClient.url;
      },

      // Suppression du fichier dans Azure Blob Storage
      async delete(file) {
        const filePath = getPath(file);
        const blockBlobClient = containerClient.getBlockBlobClient(filePath);
        await blockBlobClient.deleteIfExists();
      },

      // OPTIONNEL : Strapi appelle cette fonction pour savoir si les fichiers sont privés (c'est pas le cas ici)
      isPrivate() {
        return false;
      },

      // OPTIONNEL : Retourne une URL signée pour accéder au fichier (utilisé si `isPrivate()` == true)
      getSignedUrl(file) {
        return {
          url: file.url, // Pour fichiers publics, on retourne juste l'URL
        };
      },
    };
  },
};
