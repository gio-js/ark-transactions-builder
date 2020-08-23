import { AnticounterfeitRegisterManufacturerTransaction } from './common/ark-counterfeit-common/src/models';
/*
    La simulazione genera periodicamente nuovi produttori che entrano a far parte della catena.
    Simula un device IoT che periodicamente crea un nuovo prodotto per un 
    produttore scelto causalmente.    
*/

import { Transactions, Managers, Identities, Utils } from '@arkecosystem/crypto'
import {
    AnticounterfeitRegisterProductTransaction, RegisterManufacturerTransaction,
    RegisterProductTransaction,
    RegisterProductBuilder
} from './common/ark-counterfeit-common';
import { VENDOR_FIELD } from './common/ark-counterfeit-common/src/const';
import { RegisterManufacturerResponse } from './common/ark-counterfeit-common/src/rest/models';
const axios = require('axios');
var faker = require('faker/locale/it');

// const passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
// const recipientId = "Ac9dCo9dFgAkkBdEBsoRAN4Mm6xMsgYdZx";
//process.env.passphrase as string
const MAX_MANUFACTURER_REGISTRATIONS = 50;
//const BASE_URI = 'http://127.0.0.1:8090/api/'
const BASE_URI = 'http://80.211.134.204:8090/api/'

const manufacturers = []; // { request: AnticounterfeitRegisterManufacturerTransaction, response: RegisterManufacturerResponse }


// const network = 'testnet'
// const connection = new Connection(apiURI)



/**
 * Initialize `@arkecosystem/crypto` lib settings
 * Set the latest available block height to use latest features
 */
const initCrypto = async () => {
    Managers.configManager.setFromPreset('testnet');
    Managers.configManager.setHeight(await getLatestBlockHeight());
    Transactions.TransactionRegistry.registerTransactionType(RegisterManufacturerTransaction);
    Transactions.TransactionRegistry.registerTransactionType(RegisterProductTransaction);
}

/** Fetch the latest block height */
const getLatestBlockHeight = async (): Promise<number> => {
    const height = (await axios.get(BASE_URI + 'blockchain/height')).data.Data;
    console.log("Blockchain height: " + height);
    return height;
}

// /** Compute the wallet address from a passphrase */
// const getWalletAddress = (passphrase: string) => Identities.Address.fromPassphrase(passphrase)

/** Get a wallet next transaction nonce */
const getNextNonce = async (manufacturerAddress: string) => {
    const nonce = (await axios.get(BASE_URI + 'manufacturer/nonce/' + manufacturerAddress)).data.Data;
    console.log('Manufacturer next nonce: ' + nonce);
    return nonce.toString();
}

// /** Get a wallet balance */
// const getWalletBalance = async (walletAddress: string) => {
//     return (await getWallet(walletAddress)).balance;
// }

const registerManufacturer = async (model: AnticounterfeitRegisterManufacturerTransaction) => {
    console.log('Produttore da creare: ' + JSON.stringify(model));
    return await axios.post(BASE_URI + 'manufacturer', model);
};

/** Registra un nuovo prodotto */
const registerProduct = async (manufacturerPassphrase: string, model: AnticounterfeitRegisterProductTransaction) => {

    // const manufacturerAddressId: string = "AR96ntq6d7PkE1Ws3EKcQRK8QNqgVpMudz";
    // const manufacturerPassphrase: string = 'boat dizzy people marriage where betray yard oval split twice arm shove';

    const nonce = await getNextNonce(model.ManufacturerAddressId);
    const builder = new RegisterProductBuilder();
    const transaction = builder
        .nonce(nonce.toString())
        .product(model.ProductId, model.Description, model.ManufacturerAddressId, model.Metadata)
        .vendorField(VENDOR_FIELD)
        .recipientId(model.ManufacturerAddressId)
        .sign(manufacturerPassphrase)
        .getStruct();


    const response = await axios.post(BASE_URI + 'products', {
        Asset: model,
        Nonce: nonce.toString(),
        SenderPublicKey: transaction.senderPublicKey,
        Signature: transaction.signature,
        TransactionId: transaction.id
    });

    return response;
}

const generateRandomManufacturers = async () => {

    if (manufacturers.length >= MAX_MANUFACTURER_REGISTRATIONS)
        return;

    console.log('Generazione di un nuovo produttore.');
    //RegisterManufacturerResponse
    //AnticounterfeitRegisterManufacturerTransaction
    faker.seed(new Date().getUTCMilliseconds());

    const model = {
        ProductPrefixId: faker.random.number({
            'min': 10001,
            'max': 99999
        }).toString(),
        CompanyName: faker.company.companyName(),
        CompanyFiscalCode: faker.random.number().toString(),
        RegistrationContract: "VGhpcyBpcyBzaW1wbGUgQVNDSUkgQmFzZTY0IGZvciBTdGFja092ZXJmbG93IGV4YW1wbGUu"
    };

    try {

        const response = await registerManufacturer(model);

        if (!response.data || response.data.IsSuccess == false) {
            throw new Error('Success false');
        }

        const pushElement = {
            request: model,
            response: response.data.Data
        };
        manufacturers.push(pushElement);
        console.log('Produttore: ' + JSON.stringify(pushElement));
    } catch (ex) {
        console.error('Errore nella generazione del produttore: ', ex)
    }

    setTimeout(generateRandomManufacturers, 120000); // 2 minutes;
};

const generateRandomProducts = async () => {
    try {
        if (manufacturers.length == 0)
            throw new Error('Nessun produttore trovato');
    
        console.log('Generazione di un nuovo prodotto.');
        //RegisterManufacturerResponse
        //AnticounterfeitRegisterManufacturerTransaction
        faker.seed(new Date().getUTCMilliseconds());
    
        const manufacturerIndex = faker.random.number({
            'min': 0,
            'max': manufacturers.length - 1
        });
        console.log('Produttore scelto: ' + manufacturers[manufacturerIndex].request.CompanyName);


        const manufacturer = manufacturers[manufacturerIndex];
        const productIdKey = faker.random.number({
            'min': 100000001,
            'max': 999999999
        });
        const productName = faker.commerce.productName();
        const productType = faker.commerce.product();
        const colorName = faker.commerce.color();
        const colorPrice = faker.commerce.price();

        let minute = (new Date()).getMinutes().toString();
        minute = minute.substring(0, minute.length - minute.length) + minute;
        const response = await registerProduct(manufacturer.response.ManufacturerPassphrase, {
            ProductId: manufacturer.request.ProductPrefixId + "-" + productIdKey + "-" + minute,
            Description: productName,
            ManufacturerAddressId: manufacturer.response.ManufacturerAddressId,
            Metadata: [productType, colorName, colorPrice.toString()]
        });

        if (!response.data || response.data.IsSuccess == false) {
            throw new Error('Success false: ' + JSON.stringify(response.data));
        }
        console.log('Creato prodotto: ' + productName + " per azienda " + manufacturers[manufacturerIndex].request.CompanyName);
    } catch (ex) {
        console.error('Errore nella generazione del prodotto: ', ex)
    }

    setTimeout(generateRandomProducts, 120000); // 2 minutes;

};


(() => {
    initCrypto();
    setTimeout(generateRandomManufacturers, 30000);
    setTimeout(generateRandomProducts, 60000);

})();

