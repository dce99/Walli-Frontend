import { Card, Stack, Button, InputGroup, InputLeftAddon, Input, Box, Badge, useToast } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useEffect, useRef, useState } from "react";
import ErrorDisplay from "../../../components/Error";
import { Walli__factory } from "../../../typechain-types";
import { WalliPropType } from "../../../types/prop-types";
import { randomString } from "../../../helpers/randomString";
import { generateSignature } from "../../../helpers/sendTransaction";
import { getChainLocalStorageKey } from "../../../helpers/getChainLocalStorageKey";
import { NUMBER_OF_BLOCKS_WAIT } from "../../../helpers/const";
import { loadingToast, successToast, errorToast } from "../../../helpers/toasts";


function _2FA({ wallet, walli }: WalliPropType) {

    const [_2FAAddress, set_2FAAddress] = useState<string>("");
    const [_2FARemovalInfo, set_2FARemovalInfo] = useState({ finaliseAfter: "", guardianCount: 0n, confirmedCount: 0n, cancelledCount: 0n })
    const [fa, setFa] = useState({ enabled: false, validSession: false });
    const [otp, setOtp] = useState<number>(0);
    const [email, setEmail] = useState<string>("");
    const [error, setError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [tabIndex, setTabIndex] = useState<number>(0);
    const [otpSent, setOtpSent] = useState<boolean>(false);
    const [otpSending, setOtpSending] = useState<boolean>(false);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const walliAddress = (wallet.chainId == 5n) ? walli.goerli : walli.mumbai;
    const walliShieldURL = "https://walli-sif66uxvva-uc.a.run.app";
    const deviceId = localStorage.getItem(getChainLocalStorageKey(wallet) + "deviceId") ?? "";
    const key = localStorage.getItem(getChainLocalStorageKey(wallet) + "key") ?? "";

    useEffect(() => {
        initialise();
    }, [])

    const toast = useToast();
    const toastRef = useRef();
    const loadingInit = () => {
        // @ts-ignore
        toastRef.current = toast(loadingToast("Sending transaction, please wait."));
    }
    const loadingClose = (status: "error" | "success", description?: string) => {
        if (toastRef.current) {
            toast.close(toastRef.current);
            toastRef.current = undefined;
            if (description && status == "success")
                // @ts-ignore
                toast(successToast(description))
            else if (description)
                // @ts-ignore
                toast(errorToast(description));
        }
        else {
            if (description && status == "success")
                // @ts-ignore
                toast(successToast(description))
            else if (description)
                // @ts-ignore
                toast(errorToast(description));
        }
    }

    const handleError = (error: any) => {
        const revertData = error?.data;
        try { const decodedError = Walli__factory.createInterface().parseError(revertData); loadingClose("error", decodedError?.args[0] as string); } catch (e: any) { loadingClose("error", "JsonRpc Error: Please check input fields and try again ") }
    }

    const transaction = async (to: string, data: string) => {
        const owner = await provider.getSigner(wallet.address);
        try {
            loadingInit();
            const response = await owner.sendTransaction({
                to: ethers.getAddress(to),
                data: data,
            });
            await response.wait(NUMBER_OF_BLOCKS_WAIT);
            loadingClose("success", "Your transaction has been submitted");
            return true;
        }
        catch (error: any) {
            handleError(error);
            return false;
        }
    }

    // For own Walli, should not be used for 2FARemoval functions as that needs to be sennt to the input 2FA removal wallet address
    const initialise = async () => {
        try {
            const owner = await provider.getSigner(wallet.address);
            let data = Walli__factory.createInterface().encodeFunctionData("is2FAEnabled");
            let response = await owner.call({ to: walliAddress, data });
            const enabled = Walli__factory.createInterface().decodeFunctionResult("is2FAEnabled", response)[0];

            data = Walli__factory.createInterface().encodeFunctionData("isValidSession", [ethers.encodeBytes32String(key)]);
            response = await owner.call({ to: walliAddress, data });
            const validSession = Walli__factory.createInterface().decodeFunctionResult("isValidSession", response)[0];

            setFa({ enabled, validSession });
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const generateOtp = async () => {
        setOtpSending(true);
        const body = {
            email,
            deviceId,
        };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${process.env.REACT_APP_WALL_SHIELD_AUTH_TOKEN}`
            },
            body: JSON.stringify(body)
        };
        const res = await fetch(walliShieldURL + "/generate-otp", options);
        const ret = await res.json();
        if (ret?.data?.otp) {
            const data = {
                service_id: `${process.env.REACT_APP_EMAILJS_SERVICE_ID}`,
                template_id: `${process.env.REACT_APP_EMAILJS_TEMPLATE_ID}`,
                accessToken: `${process.env.REACT_APP_EMAILJS_ACCESS_TOKEN}`,
                user_id: `${process.env.REACT_APP_EMAILJS_USER_ID}`,
                template_params: {
                    'otp': ret?.data?.otp,
                    'send_to': email,
                }
            };

            fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(() => {
                    setOtpSending(false);
                    setOtpSent(true);
                    setTimeout(() => {
                        setOtpSent(false);
                    }, 5000);
                })
                .catch((error) => {
                    setOtpSending(false);
                    setError(true);
                    setErrorMessage(ret?.error);
                    setTimeout(() => {
                        setError(false);
                    }, 5000);
                });

        }
        else {
            setError(true);
            setErrorMessage(ret?.error);
            setTimeout(() => {
                setError(false);
            }, 5000);
        }

    }

    const registedDevice = async () => {
        const body = {
            email,
            deviceId,
            otp
        };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${process.env.REACT_APP_WALL_SHIELD_AUTH_TOKEN}`
            },
            body: JSON.stringify(body)
        };
        const res = await fetch(walliShieldURL + "/register-device", options);
        const ret = await res.json();
        if (ret?.error) {
            setError(true);
            setErrorMessage(ret?.error);
            setTimeout(() => {
                setError(false);
            }, 5000);
            return null;
        }
        if (!localStorage.getItem(getChainLocalStorageKey(wallet) + "email"))
            localStorage.setItem(getChainLocalStorageKey(wallet) + "email", email);
        return ret?.data?.expiry;
    }

    const enable2Fa = async () => {
        if (!otp) {
            setError(true);
            setErrorMessage("Please enter OTP in given box")
            setTimeout(() => {
                setError(false);
            }, 5000);
        }
        else {
            loadingInit();
            let expiry = await registedDevice();
            if (expiry == null) return;
            expiry = Math.ceil(expiry / 1000);
            const hashedEmail = ethers.keccak256(ethers.solidityPacked(["string"], [email]));

            if (!fa.enabled) { // enables 2FA and adds session
                const { signatures, messageHash, error } = await generateSignature("enable2FA", provider, wallet, walli, email, deviceId, true);
                if (signatures.length == 0) {
                    setError(true);
                    setErrorMessage(error);
                    setTimeout(() => {
                        setError(false);
                    }, 5000);
                    return;
                }
                const newKeyValue = deviceId + ":" + randomString(5);
                const data = Walli__factory.createInterface().encodeFunctionData("enable2FA", [hashedEmail, wallet.chainId, messageHash, signatures, ethers.encodeBytes32String(newKeyValue), expiry]);
                const success = await transaction(walliAddress, data);
                if (success) {
                    setFa({ enabled: true, validSession: true });
                    localStorage.setItem(getChainLocalStorageKey(wallet) + "key", newKeyValue);
                    toast.closeAll();
                    loadingClose("success", "2FA is enabled and a new Session added");
                }
                else loadingClose("error", "2FA could not be enabled")
            }
            else { // add session only
                const { signatures, messageHash, error } = await generateSignature("addSession", provider, wallet, walli, email, deviceId, true);
                if (signatures.length == 0) {
                    setError(true);
                    setErrorMessage(error);
                    setTimeout(() => {
                        setError(false);
                    }, 5000);
                    return;
                }
                // const { success, newKeyValue } = await addSession(hashedEmail, expiry, wallet.chainId, messageHash, signatures);
                const newKeyValue = deviceId + ":" + randomString(5);
                const data = Walli__factory.createInterface().encodeFunctionData("addSession", [hashedEmail, ethers.encodeBytes32String(newKeyValue), expiry, wallet.chainId, messageHash, signatures]);
                const success = await transaction(walliAddress, data);
                if (success) {
                    setFa({ enabled: true, validSession: true });
                    localStorage.setItem(getChainLocalStorageKey(wallet) + "key", newKeyValue);
                    toast.closeAll();
                    loadingClose("success", "New Session has been added")
                }
                else loadingClose("error", "2FA could not be enabled")
            }
        }
    }

    const addSession = async (hashedEmail: string, expiry: number, chainId: bigint, messageHash: string, signatures: string) => {
        const newKeyValue = deviceId + ":" + randomString(5);
        const data = Walli__factory.createInterface().encodeFunctionData("addSession", [hashedEmail, ethers.encodeBytes32String(newKeyValue), expiry, chainId, messageHash, signatures]);
        const success = await transaction(walliAddress, data);
        return { success, newKeyValue };
    }

    const initiate2FARemoval = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("initiate2FARemoval");
        await transaction(_2FAAddress, data);
    }
    const confirm2FARemoval = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("confirm2FARemoval");
        await transaction(_2FAAddress, data);
    }
    const cancel2FARemoval = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("cancel2FARemoval");
        await transaction(_2FAAddress, data);
    }
    const finalise2FARemoval = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("finalise2FARemoval");
        await transaction(_2FAAddress, data);
    }
    const get2FARemoval = async () => {
        const owner = await provider.getSigner(wallet.address);
        try {
            loadingInit();
            const response = await owner.call({
                to: _2FAAddress,
                data: Walli__factory.createInterface().encodeFunctionData("get2FARemoval")
            });
            const data = Walli__factory.createInterface().decodeFunctionResult("get2FARemoval", response)
            loadingClose("success", "2FA Removal info retreived");
            set_2FARemovalInfo({ finaliseAfter: "", guardianCount: data[1], confirmedCount: data[2], cancelledCount: data[3] })
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const initiateProps = { _2FAAddress, set_2FAAddress, initiate2FARemoval, confirm2FARemoval, cancel2FARemoval, finalise2FARemoval, requestType: "Initiate" }
    const confirmProps = { _2FAAddress, set_2FAAddress, initiate2FARemoval, confirm2FARemoval, cancel2FARemoval, finalise2FARemoval, requestType: "Confirm" }
    const cancelProps = { _2FAAddress, set_2FAAddress, initiate2FARemoval, confirm2FARemoval, cancel2FARemoval, finalise2FARemoval, requestType: "Cancel" }
    const finaliseProps = { _2FAAddress, set_2FAAddress, initiate2FARemoval, confirm2FARemoval, cancel2FARemoval, finalise2FARemoval, requestType: "Finalise" }

    return (
        <>
            <Card width={"90%"} marginLeft={"5%"} marginTop={"2%"}>
                <Stack direction={"row"} spacing={0}  >
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginLeft={"5%"} width={"60%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(0)}> Enable 2FA </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} width={"60%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(1)}> Add Session </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} width={"60%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(2)}> Initiate Removal </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} width={"60%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(3)}> Confirm Removal</Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} width={"60%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(4)}> Cancel Removal</Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} width={"60%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(5)}> Finalise Removal</Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginRight={"5%"} width={"60%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(6)}> 2FA Removal Info </Button>
                </Stack>

                {
                    (tabIndex == 0) &&
                    <> {(fa.enabled) ? <Badge variant='outline' colorScheme='green' margin={10} fontSize={"sm"} textAlign={"center"} width={"80%"} marginLeft={"10%"} > 2FA is enabled</Badge> : <Card width={"50%"} marginTop={20} marginLeft={"25%"} marginBottom={10}>
                        <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >Enable 2FA by Email </Box>
                        <Stack spacing={5} marginBottom={10}>
                            <InputGroup marginLeft={"5%"} width={"90%"}>
                                <InputLeftAddon>
                                    Email
                                </InputLeftAddon>
                                <Input type='text' placeholder='abc@example.com' value={email} onChange={(e) => setEmail(e.target.value)} />
                            </InputGroup>
                            <InputGroup marginLeft={"5%"} width={"90%"}>
                                <InputLeftAddon>
                                    OTP
                                </InputLeftAddon>
                                <Input type='number' placeholder='0' value={otp} onChange={(e) => setOtp(e.target.valueAsNumber)} />
                            </InputGroup>
                            <Stack direction={"row"} >
                                <Button size="sm" colorScheme='blue' width={"30%"} marginLeft={"20%"} onClick={(e) => generateOtp()}>Generate OTP</Button>
                                <Button size="sm" colorScheme='blue' width={"30%"} marginRight={"20%"} onClick={(e) => enable2Fa()}>Enable</Button>
                            </Stack>
                            {
                                otpSending &&
                                <Badge variant='outline' colorScheme='yellow' margin={1} fontSize={"sm"} marginLeft={"40%"} width={"20%"}> Sending Otp</Badge>
                            }
                            {
                                otpSent &&
                                <Badge variant='outline' colorScheme='green' margin={1} fontSize={"sm"}> Otp has been sent to the given email. Please check your inbox</Badge>
                            }
                        </Stack>
                    </Card>
                    }
                    </>
                }
                {
                    (tabIndex == 1) &&
                    <> {(fa.validSession) ? <Badge variant='outline' colorScheme='green' margin={10} fontSize={"sm"} textAlign={"center"} width={"80%"} marginLeft={"10%"}> Session is enabled</Badge> : <Card width={"50%"} marginTop={20} marginLeft={"25%"} marginBottom={10}>
                        <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >Add Session </Box>
                        <Stack spacing={5} marginBottom={10}>
                            <InputGroup marginLeft={"5%"} width={"90%"}>
                                <InputLeftAddon>
                                    Email
                                </InputLeftAddon>
                                <Input type='text' placeholder='abc@example.com' value={email} onChange={(e) => setEmail(e.target.value)} />
                            </InputGroup>
                            <InputGroup marginLeft={"5%"} width={"90%"}>
                                <InputLeftAddon>
                                    OTP
                                </InputLeftAddon>
                                <Input type='number' placeholder='0' value={otp} onChange={(e) => setOtp(e.target.valueAsNumber)} />
                            </InputGroup>
                            <Stack direction={"row"} >
                                <Button size="sm" colorScheme='blue' width={"30%"} marginLeft={"20%"} onClick={(e) => generateOtp()}>Generate OTP</Button>
                                <Button size="sm" colorScheme='blue' width={"30%"} marginRight={"20%"} onClick={(e) => enable2Fa()}>Add Session</Button>
                            </Stack>
                            {
                                otpSending &&
                                <Badge variant='outline' colorScheme='yellow' margin={1} fontSize={"sm"} marginLeft={"40%"} width={"20%"}> Sending Otp</Badge>
                            }
                            {
                                otpSent &&
                                <Badge variant='outline' colorScheme='green' margin={1} fontSize={"sm"}> Otp has been sent to the given email. Please check your inbox</Badge>
                            }
                        </Stack>
                    </Card>
                    }
                    </>
                }
                {
                    (tabIndex == 1) && <></>
                }
                {
                    (tabIndex == 2) &&
                    <ListData {...initiateProps} />
                }
                {
                    (tabIndex == 3) &&
                    <ListData {...confirmProps} />
                }
                {
                    (tabIndex == 4) &&
                    <ListData {...cancelProps} />
                }
                {
                    (tabIndex == 5) &&
                    <ListData {...finaliseProps} />
                }
                {
                    (tabIndex == 6) &&
                    <Card width={"50%"} marginTop={20} marginLeft={"25%"} marginBottom={10}>
                        <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >2FA Removal Info</Box>
                        <Stack spacing={5} marginBottom={10}>
                            <InputGroup marginLeft={"5%"} width={"90%"}>
                                <InputLeftAddon >
                                    2FA Removal Wallet Address
                                </InputLeftAddon>
                                <Input type='text' placeholder='0x....' value={_2FAAddress} onChange={(e) => set_2FAAddress(e.target.value)} />
                            </InputGroup>
                            <Box>
                                <Box margin={5}>
                                    <Badge variant='solid' colorScheme='gray' margin={1} fontSize={"sm"}>
                                        Finalise After(Recovery Period)
                                    </Badge>
                                    <Box>{_2FARemovalInfo.finaliseAfter}</Box>
                                </Box>
                                <Box margin={5}>
                                    <Badge variant='solid' colorScheme='gray' margin={1} fontSize={"sm"}>
                                        Guardians Count(Current)
                                    </Badge>
                                    <Box>{_2FARemovalInfo.guardianCount.toString()}</Box>
                                </Box>
                                <Box margin={5}>
                                    <Badge variant='solid' colorScheme='gray' margin={1} fontSize={"sm"}>
                                        Confirmed Count(Guardians)
                                    </Badge>
                                    <Box>{_2FARemovalInfo.confirmedCount.toString()}</Box>
                                </Box>
                                <Box margin={5}>
                                    <Badge variant='solid' colorScheme='gray' margin={1} fontSize={"sm"}>
                                        Cancelled Count(Guardians)
                                    </Badge>
                                    <Box>{_2FARemovalInfo.cancelledCount.toString()}</Box>
                                </Box>
                            </Box>
                            <Button size="sm" colorScheme='blue' width={"30%"} marginLeft={"35%"} onClick={(e) => get2FARemoval()}>Get Info</Button>
                        </Stack>
                    </Card>

                }

            </Card>
            {
                error &&
                <ErrorDisplay setError={setError} message={errorMessage} />
            }
        </>


    );
}


export type ListDataType = {
    _2FAAddress: string,
    set_2FAAddress: (e: any) => void,
    initiate2FARemoval: () => void,
    confirm2FARemoval: () => void,
    cancel2FARemoval: () => void,
    finalise2FARemoval: () => void,
    requestType: string,
}

function ListData({ _2FAAddress, set_2FAAddress, initiate2FARemoval, confirm2FARemoval, cancel2FARemoval, finalise2FARemoval, requestType }: ListDataType) {
    return (
        <Card width={"50%"} marginTop={20} marginLeft={"25%"} marginBottom={10}>
            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >{requestType} 2FA Removal</Box>
            <Stack spacing={5} marginBottom={10}>
                <InputGroup marginLeft={"5%"} width={"90%"}>
                    <InputLeftAddon>
                        2FA Removal Wallet Address
                    </InputLeftAddon>
                    <Input type='text' placeholder='0x....' value={_2FAAddress} onChange={(e) => set_2FAAddress(e.target.value)} />
                </InputGroup>
                {
                    requestType == "Initiate" &&
                    <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => initiate2FARemoval()}>Initiate</Button>
                }
                {
                    requestType == "Confirm" &&
                    <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => confirm2FARemoval()}>Confirm</Button>
                }
                {
                    requestType == "Cancel" &&
                    <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => cancel2FARemoval()}>Cancel</Button>
                }
                {
                    requestType == "Finalise" &&
                    <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => finalise2FARemoval()}>Finalise</Button>
                }
            </Stack>
        </Card>
    );
}


export default _2FA;