




// NOTE: NOT BEING USED







import { BigNumberish, BytesLike, ethers } from "ethers";
type UserOperationStruct = {
    sender: string;
    nonce: BigNumberish;
    initCode: BytesLike;
    callData: BytesLike;
    callGasLimit: BigNumberish;
    verificationGasLimit: BigNumberish;
    preVerificationGas: BigNumberish;
    maxFeePerGas: BigNumberish;
    maxPriorityFeePerGas: BigNumberish;
    paymasterAndData: BytesLike;
    signature: BytesLike;
};

const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
function packUserOp(op: UserOperationStruct, forSignature = true): string {
    if (forSignature) {
        return ethers.solidityPacked(
            ['address', 'uint256', 'bytes32', 'bytes32',
                'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
                'bytes32'],
            [op.sender, op.nonce, op.initCode, op.callData,
            op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
            op.paymasterAndData])
    } else {
        // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
        return ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint256', 'bytes', 'bytes',
                'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
                'bytes', 'bytes'],
            [op.sender, op.nonce, op.initCode, op.callData,
            op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
            op.paymasterAndData, op.signature])
    }
}

function getUserOpHash(op: UserOperationStruct, entryPoint: string, chainId: number): string {
    const userOpHash = ethers.keccak256(packUserOp(op, true))
    const enc = ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'address', 'uint256'],
        [userOpHash, entryPoint, chainId])
    return ethers.keccak256(enc)
}

export async function signUserOp(userOp: UserOperationStruct, signer: ethers.JsonRpcSigner, provider: ethers.Provider): Promise<UserOperationStruct> {
    const chainId = await provider.getNetwork().then(net => net.chainId) as number;
    const userOpHash = getUserOpHash(userOp, entryPointAddress, chainId);
    const signature = await signer.signMessage(ethers.getBytes(userOpHash));
    return {
        ...userOp,
        signature
    }
}