import { ISimpleData, IBusinessData } from './interfaces';
import { Transactions, Utils, Interfaces } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";

const { schemas } = Transactions;

const ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP = 2001;

const REGISTER_MANUFACTURER_TYPE = 201;
const REGISTER_PRODUCT_TYPE = 202;
const TRANSFER_PRODUCT_TYPE = 203;
const RECEIVE_PRODUCT_TYPE = 204;

const SIMPLE_TRANSACTION_TYPE = 301;
const SIMPLE_TRANSACTION_TYPE_GROUP = 3001;

const BUSINESS_REGISTRATION_TYPE = 100;
const BUSINESS_REGISTRATION_TYPE_GROUP = 1001;


export interface IRegisterManufacturerTransaction {
    ManufacturerAddressId: string;
    ProductPrefixID: string;
}


export class RegisterManufacturerTransaction extends Transactions.Transaction {
    public static typeGroup: number = ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP;
    public static type: number = REGISTER_MANUFACTURER_TYPE;
    public static key: string = "register_manufacturer_transaction";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "AnticounterfeitRegisterManufacturerTransaction",
            required: ["asset", "type", "typeGroup"],
            properties: {
                type: { transactionType: REGISTER_MANUFACTURER_TYPE },
                typeGroup: { const: 2001 },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["AnticounterfeitRegisterManufacturerTransaction"],
                    properties: {
                        AnticounterfeitRegisterManufacturerTransaction: {
                            type: "object",
                            required: ["ManufacturerAddressId", "ProductPrefixID"],
                            properties: {
                                ManufacturerAddressId: {
                                    type: "string",
                                    minLength: 34,
                                    maxLength: 34,
                                },
                                ProductPrefixID: {
                                    type: "string",
                                    minLength: 5,
                                    maxLength: 15,
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make("5000000000");

    public serialize(): ByteBuffer {
        const { data } = this;

        const element = data.asset!.AnticounterfeitRegisterManufacturerTransaction as IRegisterManufacturerTransaction;
        const manufacturerAddressIdBytes = Buffer.from(element.ManufacturerAddressId, "utf8");
        const prefixIdBytes = Buffer.from(element.ProductPrefixID, "utf8");

        const buffer = new ByteBuffer(manufacturerAddressIdBytes.length + prefixIdBytes.length + 2, true);
        buffer.writeUint8(manufacturerAddressIdBytes.length);
        buffer.append(manufacturerAddressIdBytes, "hex");
        buffer.writeUint8(prefixIdBytes.length);
        buffer.append(prefixIdBytes, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const AnticounterfeitRegisterManufacturerTransaction = {} as IRegisterManufacturerTransaction;

        const manufacturerAddressIdLength = buf.readUint8();
        AnticounterfeitRegisterManufacturerTransaction.ManufacturerAddressId = buf.readString(manufacturerAddressIdLength);

        const prefixIdLength = buf.readUint8();
        AnticounterfeitRegisterManufacturerTransaction.ProductPrefixID = buf.readString(prefixIdLength);

        data.asset = {
            AnticounterfeitRegisterManufacturerTransaction
        };
    }
}

export class RegisterManufacturerBuilder extends Transactions.TransactionBuilder<RegisterManufacturerBuilder> {
    constructor() {
        super();
        this.data.type = REGISTER_MANUFACTURER_TYPE;
        this.data.typeGroup = ANTICOUNTERFEIT_TRANSACTIONS_TYPE_GROUP;
        this.data.version = 2;
        this.data.fee = Utils.BigNumber.make("5000000000");
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { AnticounterfeitRegisterManufacturerTransaction: {} };
    }

    public manufacturer(addressId: string, prefixId: string): RegisterManufacturerBuilder {
        this.data.asset!.AnticounterfeitRegisterManufacturerTransaction = {
            ManufacturerAddressId: addressId,
            ProductPrefixID: prefixId
        };

        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): RegisterManufacturerBuilder {
        return this;
    }
}

export class SimpleTransactionBuilder extends Transactions.TransactionBuilder<SimpleTransactionBuilder> {

    /**
     *
     */
    constructor() {
        super();
        this.data.type = SIMPLE_TRANSACTION_TYPE;
        this.data.typeGroup = SIMPLE_TRANSACTION_TYPE_GROUP;
        this.data.version = 2;
        this.data.fee = Utils.BigNumber.make('1000000');
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { simpleData : {} };
    }

    public simpleData(id: string): SimpleTransactionBuilder {
        this.data.asset!.simpleData = {
            Id: id
        };

        return this;
    }

    public getStruct() : Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
      }

    protected instance(): SimpleTransactionBuilder {
        return this;
    }

}


export class SimpleTransaction extends Transactions.Transaction {
    public static typeGroup: number = SIMPLE_TRANSACTION_TYPE_GROUP;
    public static type: number = SIMPLE_TRANSACTION_TYPE;
    public static key: string = "simple_transaction";

    serialize(): import("bytebuffer") {
        const { data } = this;
        const simpleData = data.asset!.simpleData as ISimpleData;

        const idBytes = Buffer.from(simpleData.Id, 'utf8');
        const buffer = new ByteBuffer(idBytes.length + 2, true);
        buffer.writeUint16(idBytes.length);
        buffer.append(idBytes, 'hex');

        return buffer;
    }

    deserialize(buf: import("bytebuffer")): void {
        const { data } = this;
        const simpleData = {} as ISimpleData;

        const idLength = buf.readUint16();
        simpleData.Id = buf.readString(idLength);

        data.asset = { simpleData };
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make('1000000');

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "simpleData",
            required: ["asset", "type", "typeGroup"],
            properties: {
                type: { transactionType: SIMPLE_TRANSACTION_TYPE },
                typeGroup: { const: SIMPLE_TRANSACTION_TYPE_GROUP },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["simpleData"],
                    properties: {
                        simpleData: {
                            type: "object",
                            required: ["Id"],
                            properties: {
                                Id: {
                                    type: "string",
                                    minLength: 5,
                                    maxLength: 10,
                                }
                            },
                        },
                    },
                },
            },
        });
    }

}

export class BusinessRegistrationTransaction extends Transactions.Transaction {
    public static typeGroup: number = BUSINESS_REGISTRATION_TYPE_GROUP;
    public static type: number = BUSINESS_REGISTRATION_TYPE;
    public static key: string = "business_key";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "businessData",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: BUSINESS_REGISTRATION_TYPE },
                typeGroup: { const: 1001 },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["businessData"],
                    properties: {
                        businessData: {
                            type: "object",
                            required: ["name", "website"],
                            properties: {
                                name: {
                                    type: "string",
                                    minLength: 3,
                                    maxLength: 20,
                                },
                                website: {
                                    type: "string",
                                    minLength: 3,
                                    maxLength: 20,
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make("5000000000");

    public serialize(): ByteBuffer {
        const { data } = this;

        const businessData = data.asset!.businessData as IBusinessData;

        const nameBytes = Buffer.from(businessData.name, "utf8");
        const websiteBytes = Buffer.from(businessData.website, "utf8");

        const buffer = new ByteBuffer(nameBytes.length + websiteBytes.length + 2, true);

        buffer.writeUint8(nameBytes.length);
        buffer.append(nameBytes, "hex");

        buffer.writeUint8(websiteBytes.length);
        buffer.append(websiteBytes, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const businessData = {} as IBusinessData;
        const nameLength = buf.readUint8();
        businessData.name = buf.readString(nameLength);

        const websiteLength = buf.readUint8();
        businessData.website = buf.readString(websiteLength);

        data.asset = {
            businessData,
        };
    }
}

export class BusinessRegistrationBuilder extends Transactions.TransactionBuilder<BusinessRegistrationBuilder> {
    constructor() {
        super();
        this.data.type = BusinessRegistrationTransaction.type;
        this.data.typeGroup = BusinessRegistrationTransaction.typeGroup;
        this.data.version = 2;
        this.data.fee = Utils.BigNumber.make("5000000000");
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { businessData: {} };
    }

    public businessData(name: string, website: string): BusinessRegistrationBuilder {
        this.data.asset!.businessData = {
            name,
            website,
        };

        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BusinessRegistrationBuilder {
        return this;
    }
}
