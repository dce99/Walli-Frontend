import { Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from "@chakra-ui/react"
import { useEffect } from "react"


type ErrorPropType = {
  setError: (x: boolean) => void,
  message: string
}


function ErrorDisplay({ setError, message }: ErrorPropType) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  useEffect(() => {
    onOpen();
  }, [])

  const onModalClose = () => {
    setError(false);
    onClose();
  }

  return (
    <Modal isCentered isOpen={isOpen} onClose={onModalClose}>
      <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(100deg)' />
      <ModalContent>
        <ModalHeader color={"white"} bg="maroon">Error</ModalHeader>
        <ModalCloseButton bg="white" _hover={{color: "blue", borderColor:"blue"}}/>
        <ModalBody>
          <Box>"{message}"</Box>
        </ModalBody>
        <ModalFooter>
          {/* <Button onClick={onModalClose}>Close</Button> */}
          
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ErrorDisplay;