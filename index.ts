/*
Sign and submit a transaction with ARK Blockchain v2.6+
Libs:
@arkecosystem/client: ^1.0.5
@arkecosystem/crypto: ^2.6.0-next.6
*/

import { Connection } from '@arkecosystem/client'
import { Transactions, Managers, Identities, Utils } from '@arkecosystem/crypto'
import { ITransactionData } from '@arkecosystem/crypto/dist/interfaces'
import {
    SimpleTransactionBuilder, SimpleTransaction,
    BusinessRegistrationTransaction, BusinessRegistrationBuilder,
    RegisterManufacturerBuilder, RegisterManufacturerTransaction
} from './transaction';
//import { RegisterManufacturerTransaction, RegisterManufacturerBuilder } from './dist/transaction';



const passphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const recipientId = "Ac9dCo9dFgAkkBdEBsoRAN4Mm6xMsgYdZx";
//process.env.passphrase as string
const apiURI = 'http://192.168.1.227:4003/api/v2'
const network = 'testnet'

const connection = new Connection(apiURI)


/** Fetch the latest block height */
const getLatestBlockHeight = async (): Promise<number> => (await connection.get('blockchain')).body.data.block.height

/**
 * Initialize `@arkecosystem/crypto` lib settings
 * Set the latest available block height to use latest features
 */
const initCrypto = async () => {
    Managers.configManager.setFromPreset(network);
    Managers.configManager.setHeight(await getLatestBlockHeight());
    Transactions.TransactionRegistry.registerTransactionType(RegisterManufacturerTransaction);
    Transactions.TransactionRegistry.registerTransactionType(SimpleTransaction);
    Transactions.TransactionRegistry.registerTransactionType(BusinessRegistrationTransaction);
}

/** Compute the wallet address from a passphrase */
const getWalletAddress = (passphrase: string) => Identities.Address.fromPassphrase(passphrase)

/** Get a wallet */
const getWallet = async (walletAddress: string) => {
    return (await connection.api('wallets').get(walletAddress)).body.data;
}

/** Get a wallet next transaction nonce */
const getNextNonce = async (walletAddress: string) => {
    const nonce = (await getWallet(walletAddress)).nonce;
    return (parseInt(nonce, 10) + 1).toString()
}

/** Get a wallet balance */
const getWalletBalance = async (walletAddress: string) => {
    return (await getWallet(walletAddress)).balance;
}

/**
 * Build and sign a new transaction
 * @param receiverAddress Recipient wallet address
 * @param amount Amount of ARK to send in arktoshi (default = 0.1 ARK = 0.1 * 1e8 arktoshi)
 * @param fee Amount of ARK used for the transaction fee (default = 0.01 ARK = 0.01 * 1e8 arktoshi)
 * @param vendorField Vendor field (SmartBridge)
 */
const signTransaction = async (
    receiverAddress: string,
    amount: string = `${0.1 * 1e8}`,
    fee: string = `${0.01 * 1e8}`,
    vendorField?: string,
) => {
    // Get wallet's next transaction nonce
    const nextNonce = await getNextNonce(getWalletAddress(passphrase))

    // Build the transaction
    let transactionToSend = Transactions.BuilderFactory
        .transfer()
        .recipientId(receiverAddress)
        .amount(amount)
        .fee(fee)
        .version(2)
        .nonce(nextNonce)

    // Set the bridge chain field
    if (vendorField) transactionToSend.vendorField(vendorField)

    return transactionToSend.sign(passphrase).getStruct()
}

/**
 * Send custom transaction
 */
const signCustomTransaction = async (
    receiverAddress: string,
    amount: string = `${0.1 * 1e8}`,
    fee: string = `${0.01 * 1e8}`,
    vendorField?: string,
) => {
    const senderAddressId = getWalletAddress(passphrase);

    // Get wallet's next transaction nonce
    const nextNonce = await getNextNonce(senderAddressId)

    // manufacturer
    const builder = new RegisterManufacturerBuilder();
    let actual = builder
        .nonce(nextNonce)
        .manufacturer("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo", "AES1212")
        .fee(fee)
        .sign(passphrase);

    // simple transaction
    // const builder = new SimpleTransactionBuilder();
    // const actual = builder
    //     .simpleData("123456")
    //     .nonce(nextNonce)
    //     .fee(fee)
    //     .sign(passphrase);


    // business transaction
    // const builder = new BusinessRegistrationBuilder();
    // const actual = builder
    //        .businessData("facebook", "www.facebook.it")
    //        .nonce(nextNonce)
    //        .fee(fee)
    //        .sign(passphrase);


    if (vendorField) actual.vendorField(vendorField)
    //console.log(transactionToSend.sign(passphrase).build().toJson())
    return actual.getStruct(); //.sign(passphrase).getStruct()
}

/**
 * Submit a signed transaction to the blockchain
 * @param transaction Signed transaction
 */
const sendTransaction = (transaction: ITransactionData) => connection.api('transactions')
    .create({ transactions: [transaction] })


const logBalances = async () => {
    try {
        //await initCrypto();

        const senderId: string = getWalletAddress(passphrase);

        // log balance
        console.log(`Sender   : ${senderId}: ${(await getWalletBalance(senderId))}`);
        console.log(`Recipient: ${recipientId}: ${(await getWalletBalance(recipientId))}`);
    } catch (err) {
        console.error(err);
    }
};

const init = async (customTransaction: boolean) => {
    let res = null;

    try {
        // Init crypto lib
        await initCrypto()

        // log balance
        await logBalances();

        // Sign the transaction with crypto lib
        let transactionToSend = null;

        if (customTransaction) {
            transactionToSend = await signCustomTransaction(
                recipientId, // Destination address
                "0", // Send 1 ARK
                "5000000000", // Pay 0.1 ARK transaction fee
                'UniMI-Anticounterfeit' // Bridge chain field (vendorField)
            )

        }
        else {
            transactionToSend = await signTransaction(
                recipientId, // Destination address
                `${1 * 1e8}`, // Send 1 ARK
                `${0.1 * 1e8}`, // Pay 0.1 ARK transaction fee
                'UniMI-AntiCounterfeit' // Bridge chain field (vendorField)
            );
        }
        //console.log(transactionToSend)
        console.log(JSON.stringify(transactionToSend))

        // Submit the transaction to the blockchain
        res = await sendTransaction(transactionToSend)
        console.log(res.body.data);
        console.log(JSON.stringify(res.body.errors));

    }
    catch (err) {
        console.error(err)
    }
}

init(true)
//logBalances()

//new BusinessRegistrationTransaction();