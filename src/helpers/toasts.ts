


export const successToast = (description: string)=>{
    return {
        title: 'Transaction Successfull',
        description,
        status: 'success',
        duration: 10000,
        isClosable: true,
        containerStyle: {
            width: '500px',
            maxWidth: '100%',
        },
    }
}

export const errorToast = (description: string)=>{
    return {
        title: 'Transaction Failed',
        description,
        status: 'error',
        duration: 10000,
        isClosable: true,
        containerStyle: {
            width: '500px',
            maxWidth: '100%',
        },
    }
}

export const loadingToast = (description: string)=>{
    return {
        title: 'Transaction Pending',
        description,
        duration: 7 * 60000,
        status: 'loading',
        isClosable: true,
        containerStyle: {
            width: '500px',
            maxWidth: '100%',
        },
    }
}

export const infoToast = (description: string)=>{
    return {
        title: 'Note',
        description,
        status: 'info',
        duration: 7000,
        isClosable: true,
        containerStyle: {
            width: '500px',
            maxWidth: '100%',
        },
    }
}