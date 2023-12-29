import { BigNumberish, ethers } from "ethers";
import { IWallet } from "../interface/WalletInterface";
import { Walli__factory } from "../typechain-types";
import { BundlerJsonRpcProvider, Client, Presets, UserOperationBuilder } from "userop";
import { WalliType } from "../types/prop-types";
import { OpToJSON } from "userop/dist/utils";
import { NUMBER_OF_BLOCKS_WAIT } from "./const";


interface GasEstimate {
    preVerificationGas: BigNumberish;
    verificationGasLimit: BigNumberish;
    callGasLimit: BigNumberish;

    // TODO: remove this with EntryPoint v0.7
    verificationGas: BigNumberish;
}

type func = (e: any) => void;

const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

export async function sendTransaction(data: any, provider: ethers.BrowserProvider, wallet: IWallet, walli: WalliType, handleError: func) {
    
    try {
        const owner = await provider.getSigner(wallet.address);
        const walliAddress = (wallet.chainId == 5n) ? walli.goerli : walli.mumbai;
        // const bundlerUrl = (wallet.chainId == 5n) ? `https://api.stackup.sh/v1/node/${process.env.REACT_APP_STACKUP_TESTNET_API_GOERLI}` : `https://api.stackup.sh/v1/node/${process.env.REACT_APP_STACKUP_TESTNET_API_MUMBAI}`;
        // const sender = walliAddress;
        // const response = await owner.call({
        //     to: sender,
        //     data: Walli__factory.createInterface().encodeFunctionData("getNonce")
        // });
        // const nonce = Walli__factory.createInterface().decodeFunctionResult("getNonce", response)[0];
        // const feeData = await new BundlerJsonRpcProvider(bundlerUrl).getFeeData();
        // const signUserOperation = async (ctx: any) => {
        //     const hash = ctx.getUserOpHash();
        //     const signature = await owner.signMessage(ethers.getBytes(hash));
        //     ctx.op.signature = signature;
        // };
        // const estimateUserOperationGas = async (ctx: any) => {
        //     try {
        //         const params =
        //             ctx.stateOverrides !== undefined
        //                 ? [OpToJSON(ctx.op), ctx.entryPoint, ctx.stateOverrides]
        //                 : [OpToJSON(ctx.op), ctx.entryPoint];
        //         const est = (await new BundlerJsonRpcProvider(bundlerUrl).send(
        //             "eth_estimateUserOperationGas",
        //             params
        //         )) as GasEstimate;
        //         ctx.op.preVerificationGas = est.preVerificationGas;
        //         ctx.op.verificationGasLimit = est.verificationGasLimit ?? est.verificationGas;
        //         ctx.op.callGasLimit = est.callGasLimit;
        //     }
        //     catch(error){
        //         console.log(error);
        //     }
        // };
        
        // const paymasterContext = {type: "payg"};
        // const paymasterRpc =  (wallet.chainId == 5n)? `https://api.stackup.sh/v1/paymaster/${process.env.REACT_APP_STACKUP_TESTNET_API_GOERLI}`  : `https://api.stackup.sh/v1/paymaster/${process.env.REACT_APP_STACKUP_TESTNET_API_MUMBAI}`
        // const builder = new UserOperationBuilder().useDefaults({ sender, nonce, callData: data, maxFeePerGas: (feeData.maxFeePerGas) ? feeData.maxFeePerGas : 0n, maxPriorityFeePerGas: (feeData.maxPriorityFeePerGas) ? feeData.maxPriorityFeePerGas : 0n }).useMiddleware(signUserOperation).useMiddleware(estimateUserOperationGas).useMiddleware(signUserOperation).useMiddleware(Presets.Middleware.verifyingPaymaster(paymasterRpc, paymasterContext)).useMiddleware(signUserOperation)//.buildOp(entryPointAddress, wallet.chainId);
        // const client = await Client.init(bundlerUrl); 
        // // The maximum amount of time to wait for the UserOperationEvent after calling response.wait()
        // // client.waitTimeoutMs = 60000;
        // // The interval at which it will poll the node to look up UserOperationEvent.
        // // client.waitIntervalMs = 5000;
        // const res = await client.sendUserOperation(builder, {
        //     onBuild: (op) => console.log("Signed UserOperation:", op)
        // });
        // console.log(`UserOpHash: ${res.userOpHash}`);
        // const event= await res.wait();
        // console.log(event?.transactionHash, event);

        const res =await owner.sendTransaction({
            to: walliAddress,
            data,
        });
        await res.wait(NUMBER_OF_BLOCKS_WAIT);
        return true;
    }
    catch (error: any) {
        handleError(error);
        return false;
    }
}

const walliShieldURL = "https://walli-sif66uxvva-uc.a.run.app";
export const generateSignature = async (selector:string, provider: ethers.BrowserProvider, wallet: IWallet, walli: WalliType, email: string, deviceId: string, generateCombined?: boolean) => {

    if(!generateCombined) generateCombined = false;
    
    const owner = await provider.getSigner(wallet.address);
    const walliAddress = (wallet.chainId == 5n) ? walli.goerli : walli.mumbai;
    let response = await owner.call({
        to: walliAddress,
        data: Walli__factory.createInterface().encodeFunctionData("getNonce")
    });
    const nonce = Walli__factory.createInterface().decodeFunctionResult("getNonce", response)[0];
    const messageHash = ethers.keccak256(ethers.solidityPacked(["string", "address", "uint256", "uint256"], [selector, entryPointAddress, wallet.chainId, nonce]));
    const signature = await owner.signMessage(ethers.getBytes(messageHash));
    response = await owner.call({
        to: walliAddress,
        data: Walli__factory.createInterface().encodeFunctionData("is2FAEnabled")
    });
    const is2FAEnabled = Walli__factory.createInterface().decodeFunctionResult("is2FAEnabled", response)[0];
    if (is2FAEnabled || generateCombined == true) {

        const body = {
            email,
            deviceId,
            signature,
            messageHash
        };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${process.env.REACT_APP_WALL_SHIELD_AUTH_TOKEN}`
            },
            body: JSON.stringify(body)
        };
        const res = await fetch(walliShieldURL + "/generate-signature", options);
        const ret = await res.json();
        if (ret?.error) 
            return { signatures: "", messageHash: "", error: ret?.error };
        return { signatures: ret?.data?.signature, messageHash };
    }
    else{
        return { signatures: signature, messageHash }
    }
}