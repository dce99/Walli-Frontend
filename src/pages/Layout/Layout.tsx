import { useState} from "react";
import { Link, Outlet } from "react-router-dom";
import { Box, Button, Flex, Menu, MenuButton, MenuDivider, MenuGroup, MenuItem, MenuList } from "@chakra-ui/react";
import {  TriangleDownIcon } from '@chakra-ui/icons'

function Layout() {

    const [selected, setSelected] = useState("Home");
    
    const handleSelected = (e:any)=>{
        // e.stopPropagation();
        if(selected == "Home")
            setSelected("Wallet");
        else{
            setSelected("Home");
        }
    }

    return (
        <div className="Layout">
            <Flex justifyContent={"stretch"} bg={"black"}>
                <Menu>
                    <MenuButton as={Button} colorScheme='white' bg="white" textColor={"black"} marginLeft={"4"} >
                    <TriangleDownIcon/> {selected}
                    </MenuButton>
                    <MenuList>
                        <MenuGroup title=''>
                            <MenuItem onClick={handleSelected} textAlign={"center"}><Link to="/">Home</Link></MenuItem>
                        </MenuGroup>
                        <MenuDivider />
                        <MenuGroup title=''>
                            <MenuItem onClick={handleSelected} textAlign={"center"}><Link to="/wallet" >Wallet</Link></MenuItem>
                        </MenuGroup>
                    </MenuList>
                </Menu>

                <Box marginLeft={"35%"} marginTop={"5"} marginBottom={5} textColor={"whitesmoke"} fontSize={"xxx-large"}> 🅦🅐🅛🅛🅘 </Box>
            </Flex>

            <Outlet />

        </div>

    )
}


export default Layout;