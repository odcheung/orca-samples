import { Connection, Keypair } from "@solana/web3.js";
import { getOrca, OrcaPoolConfig } from "orca-typescript-sdk"
import { readFile } from "mz/fs"

let connection: Connection | undefined

async function getKeyPair(keyPath: string): Promise<Keypair> {
    const buffer = await readFile(keyPath)
    let data = JSON.parse(buffer.toString())
    return Keypair.fromSecretKey(toBuffer(data))
}

export async function swapStuff() {
    const connection = await getConnection()
    const orca = getOrca(connection)

    try {
        let userFeeAddress = await getKeyPair("/Users/ottocheung/dev/solana/pub.json");

        let pool = orca.getPool(OrcaPoolConfig.ETH_USDC)

        let returnVal = await pool?.getLPBalance(userFeeAddress.publicKey)
        console.log("User has ETH-USDC LP token balance of - " + returnVal);
    } catch (err) {
        console.log(err);
    }
}

swapStuff().then(() => {
    console.log("Complete.")
});

async function getConnection(
    url: string = "https://api.mainnet-beta.solana.com"
): Promise<Connection> {
    if (connection) return connection;

    connection = new Connection(url, "singleGossip");
    const version = await connection.getVersion();

    console.log("Connection to cluster established:", url, version);
    return connection;
}

const toBuffer = (arr: Buffer | Uint8Array | Array<number>): Buffer => {
    if (arr instanceof Buffer) {
        return arr;
    } else if (arr instanceof Uint8Array) {
        return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
    } else {
        return Buffer.from(arr);
    }
};
