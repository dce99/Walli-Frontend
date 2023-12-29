
import { Modal, ModalBody, ModalContent, ModalOverlay, Spinner, useDisclosure } from "@chakra-ui/react"
import { useEffect } from "react"

function SpinnerDisplay() {
    const { isOpen, onOpen, onClose } = useDisclosure()

    useEffect(() => {
        onOpen();
    }, [])

    return (
        <Modal isCentered isOpen={isOpen} onClose={onClose} >
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(90deg)'  />
            <ModalContent width={"7%"} >
                <ModalBody >
                    <Spinner
                        thickness='4px'
                        speed='0.65s'
                        emptyColor='gray.200'
                        color='blue.500'
                        size='xl'
                    />
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}

export default SpinnerDisplay;