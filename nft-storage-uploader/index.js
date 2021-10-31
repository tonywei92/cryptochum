import fs from 'fs'
import path from 'path';
import { NFTStorage, File } from 'nft.storage'
import { fileURLToPath } from 'url';

const endpoint = 'https://api.nft.storage' // the default
const token = '' // your API key from https://nft.storage/manage
const storage = new NFTStorage({ endpoint, token })

async function uploadImages(fileName, idx, callback) {
  const metadata = await storage.store({
    name: `${fileName}`,
    description:
      `Wearable design: ${fileName}`,
    image: new File([await fs.promises.readFile(`images/${fileName}`)], fileName, {
      type: 'image/png',
    })
  })

  console.log('Uploaded: ' , fileName, metadata.embed().image.href, idx);
  callback({
    name: fileName,
    http_link: metadata.embed().image.href,
    ifps_link: metadata.data.image.href
  }); 
}

function executeJsonExport(result) {
  const data = JSON.stringify(result, null, 4);

  fs.writeFile('results.json', data, (err) => {
      if (err) {
          throw err;
      }
      console.log("JSON data is saved.");
  });
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const directoryPath = path.join(__dirname, 'images');

  console.log("Uploading ...");
  const jsonResult = await new Promise((resolve, reject) => {
      let result = [];
      fs.readdir(directoryPath, async function (err, files) {
        if (err) {
            reject('Unable to scan directory: ' + err);
        } 
        for (let i = 0; i < files.length; i += 1) {
          await uploadImages(files[i], i + 1, (response) => {
            result.push(response);
          }); 
        }

        resolve(result);
    });
  })

  executeJsonExport(jsonResult);
}
main()