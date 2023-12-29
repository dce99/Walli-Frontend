import { useNavigate } from "react-router-dom";
import { IWallet } from "../../interface/WalletInterface";
import { Card, Stack, CardBody, Heading, CardFooter, Button, Box, Image, Text, Badge } from "@chakra-ui/react";


type HomePropType = {
    wallet: IWallet
}

function Home() {
    const navigate = useNavigate();
    const handleSmartAccount = () => {
        navigate("/wallet");
    }

    return (
        <div className="Home">

            <Card
                direction={{ base: 'column' }}
                overflow='auto'
                // variant='outline'
                // height={"1000"}
                width={"200"}
                bg={"whitesmoke"}
                margin={0}
            >
                <Image
                    objectFit='cover'
                    maxW={{ base: '100%' }}
                    maxH={{ base: '100%', sm: "100px" }}
                    src='https://img.freepik.com/premium-vector/crypto-currency-horizontal-banner-bitcoin-digital-web-money-technology_48369-13318.jpg?w=2000'
                    alt='Crypto Wallet'
                />

                <Card width={"70%"} marginTop={10} marginLeft={"15%"} marginBottom={10}>
                    <CardBody margin={"5"}>
                        <Heading size='lg'>Account Abstracted Wallet (Polygon Mumbai)</Heading>

                        <Box py='2' >
                            <Text fontSize={"large"} margin={"2"} fontFamily={"sans-serif"}> Walli is an ERC4337 Account Abstracted wallet, a smart contract account which holds funds for users and performs transactions on behalf of user. 
                                <br />A guarded, lockable, recoverable, upgradeable wallet with 2FA.
                            </Text>
                            <Box textDecoration={"underline"} fontWeight={"bold"} fontSize={"md"} padding={"1"}>Note: Switch to "Polygon Mumbai" network. Currently only "Polygon Mumbai" is supported</Box>
                            <Button variant='solid' colorScheme='blue' onClick={handleSmartAccount} marginBottom={"5"} marginTop={"7"}>
                                Get Started
                            </Button>
                        </Box>
                        <Card marginLeft={20} overflow={"scroll"} padding={"2"} bg={"azure"}>
                            <Text fontWeight={"bold"} fontSize={"x-large"} textAlign={"center"}>Features</Text>
                            <ul >
                                <li >
                                    <Box margin={"2"} padding={"1"}>
                                        <Text textDecoration={"underline"} fontWeight={"bold"}>Guardians</Text>
                                        <Text margin={"3"} fontFamily={"monospace"} fontSize={"15px"}>
                                            Guardians can help recover your account on device loss or help in disabling 2FA, by voting.<br />
                                            Add or remove guardians. There is a secuirty period of two minutes on Mumbai testnet.
                                        </Text>
                                    </Box>
                                </li>
                                <li >
                                    <Box margin={"2"} padding={"1"}>
                                        <Text textDecoration={"underline"} fontWeight={"bold"}>Social Recovery</Text>
                                        <Text margin={"3"} fontFamily={"monospace"} fontSize={"15px"}>
                                            Recover your account in case of device loss, with the help of Guardians.
                                            <br /> When initiated a recovery by a guardian, all guardians of your wallet can vote on recovery.
                                            <br /> On majority votes, recovery may be finalised or cancelled
                                            <br /><br />
                                            <Text textDecoration={"underline"}>Recovery can be finalised by the guardians by acheiving a majority.</Text>
                                            <Text textDecoration={"underline"}>Recovery can only be initiated, confirmed, cancelled or finalised by a Guardian.</Text>
                                            <Text textDecoration={"underline"}>There is a secuirty period of 2 minutes on Mumbai testnet.</Text>
                                        </Text>
                                    </Box>
                                </li>
                                <li >
                                    <Box margin={"2"} padding={"1"}>
                                        <Text textDecoration={"underline"} fontWeight={"bold"}>Two Factor Authentication(2FA)</Text>
                                        <Text margin={"3"} fontFamily={"monospace"} fontSize={"15px"}>
                                            <Text bg={"antiquewhite"} padding={"4"} rounded={"md"}>
                                                Even if your private keys are stolen, you can still make sure that no transfer transactions are successfull as they will require
                                                an active session with the smart wallet, which can only happen after authenticating the associated email with your smart wallet.<br />
                                            </Text>
                                            <br />
                                            <Text textDecoration={"underline"}>2FA can be disabled by the guardians by acheiving a majority.</Text>
                                            <Text textDecoration={"underline"}>2FA removal can only be initiated, confirmed, cancelled or finalised by a Guardian.</Text>
                                            <Text textDecoration={"underline"}>There is a secuirty period of 2 minutes on Mumbai testnet.</Text>
                                        </Text>
                                    </Box>
                                </li>
                                <li >
                                    <Box margin={"2"} padding={"1"}>
                                        <Text textDecoration={"underline"} fontWeight={"bold"}>Gas Abstraction</Text>
                                        <Text margin={"3"} fontFamily={"monospace"} fontSize={"15px"}>
                                            Send haslefree gasless transactions.(Currently not working)
                                        </Text>
                                    </Box>
                                </li>
                                <li >
                                    <Box margin={"2"} padding={"1"}>
                                        <Text textDecoration={"underline"} fontWeight={"bold"}>Trusted Contacts</Text>
                                        <Text margin={"3"} fontFamily={"monospace"} fontSize={"15px"}>
                                            Safely transact with your loved ones above the transfer limt by adding trusted contacts
                                        </Text>
                                    </Box>
                                </li>
                                <li >
                                    <Box margin={"2"} padding={"1"}>
                                        <Text textDecoration={"underline"} fontWeight={"bold"}>Transfer Limits</Text>
                                        <Text margin={"3"} fontFamily={"monospace"} fontSize={"15px"}>
                                            Set native or ERC20 transfer limit per transaction.
                                        </Text>
                                    </Box>
                                </li>
                                <li >
                                    <Box margin={"2"} padding={"1"}>
                                        <Text textDecoration={"underline"} fontWeight={"bold"}>Bridging</Text>
                                        <Text margin={"3"} fontFamily={"monospace"} fontSize={"15px"}>
                                            Bridge your assets from one network to another
                                        </Text>
                                    </Box>
                                </li>
                                <li >
                                    <Box margin={"2"} padding={"1"}>
                                        <Text textDecoration={"underline"} fontWeight={"bold"}>Lock</Text>
                                        <Text margin={"3"} fontFamily={"monospace"} fontSize={"15px"}>
                                            Lock your wallet to prevent any transfers
                                        </Text>
                                    </Box>
                                </li>
                            </ul>
                        </Card>
                    </CardBody>

                    <CardFooter >
                        <Text textAlign={"center"} width={"100%"}>
                            @Copyright Walli 2023<br />
                            <Button onClick={() => window.location.href = "https://www.linkedin.com/in/dhiren-chugh-65558417b/"} width={"100%"} marginLeft={"0"} bg={"white"} _hover={{ bg: 'white' }}><svg xmlns="http://www.w3.org/2000/svg" height="40" width="40" viewBox="0 0 448 512"><path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z" /></svg></Button>
                            <br />
                            Email: dhirenchugh23@gmail.com
                        </Text>
                    </CardFooter>
                </Card>
            </Card>
        </div>
    );
}

export default Home;