// components/WarnClose.tsx
import React from "react";
import { useRouter } from "next/router";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
} from "@nextui-org/react";

interface WarnCloseProps {
    warning: string;
}

const WarnClose: React.FC<WarnCloseProps> = ({ warning }) => {
    const router = useRouter();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [targetUrl, setTargetUrl] = React.useState("/"); // This is the URL the user was trying to navigate to when the warning was triggered
    const isNavigating = React.useRef(false);

    const handleRouteChange = (target: string) => {
        if (isNavigating.current) {
            return;
        }
        router.events.emit("routeChangeError");
        setTargetUrl(target);
        onOpen();
        isNavigating.current = true;
        throw "Route change paused. Awaiting user confirmation.";
    };

    React.useEffect(() => {
        router.events.on("routeChangeStart", handleRouteChange);
        return () => {
            router.events.off("routeChangeStart", handleRouteChange);
        };
    }, []);

    const proceedWithNavigation = async () => {
        await router.push(targetUrl);
        isNavigating.current = false;
        onClose();
    };

    const abortNavigation = () => {
        isNavigating.current = false;
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={abortNavigation}>
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader>Navigation Alert</ModalHeader>
                        <ModalBody>
                            <p>{warning}</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="danger"
                                variant="light"
                                onPress={proceedWithNavigation}
                            >
                                Leave
                            </Button>
                            <Button color="primary" onClick={abortNavigation}>
                                Stay
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default WarnClose;
