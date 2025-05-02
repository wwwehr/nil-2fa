import { useState, useEffect } from "react";

import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { FcDataConfiguration, FcInfo, FcGoogle, FcKey } from "react-icons/fc";
import { FiEye, FiEdit, FiShare2, FiUsers } from "react-icons/fi";
import {
  type NucTokenEnvelope,
} from "@nillion/nuc";

import {
  CloseButton,
  RadioCard,
  Icon,
  Button,
  Center,
  HStack,
  VStack,
  Separator,
  Steps,
  Flex,
  Dialog,
  Portal,
  createOverlay,
} from "@chakra-ui/react";

import { useZkLogin } from "../contexts/ZkLoginContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface DialogProps {
  title: string;
  description?: string;
  content?: React.ReactNode;
}

interface PermissionOption {
  value: string;
  title: string;
  description: string;
  icon: React.ReactElement;
}

const PermissionRadioCards = () => {
  const [value, setValue] = useState<string>("read");

  const items: PermissionOption[] = [
    {
      value: "read",
      title: "This app can read all my data",
      description:
        "Allows the application to view your information but not modify it.",
      icon: <FiEye />,
    },
    {
      value: "write",
      title: "This app can make changes to my data",
      description: "Allows the application to modify your information.",
      icon: <FiEdit />,
    },
    {
      value: "share",
      title: "This app can allow my data to be read by their partners",
      description:
        "Allows the application to share your information with partner companies.",
      icon: <FiShare2 />,
    },
    {
      value: "partner_write",
      title: "This app can allow any of their partners to change my data",
      description: "Allows partner companies to modify your information.",
      icon: <FiUsers />,
    },
  ];

  return (
    <>
      <RadioCard.Root
        defaultValue="read"
        onChange={(val: any) => setValue(val.target.value)}
        gap="14"
      >
        <Flex gap="4" direction="column">
          {items.map((item) => (
            <RadioCard.Item key={item.value} value={item.value}>
              <RadioCard.ItemHiddenInput />
              <RadioCard.ItemControl>
                <RadioCard.ItemContent>
                  <HStack m={2}>
                    <Icon fontSize="lg" color="fg.muted">
                      {item.icon}
                    </Icon>
                    <RadioCard.ItemText>{item.title}</RadioCard.ItemText>
                  </HStack>
                  <RadioCard.ItemDescription p={5}>
                    {item.description}
                  </RadioCard.ItemDescription>
                </RadioCard.ItemContent>
                <RadioCard.ItemIndicator m={2} />
              </RadioCard.ItemControl>
            </RadioCard.Item>
          ))}
        </Flex>
      </RadioCard.Root>
    </>
  );
};

const dialog = createOverlay<DialogProps>((props) => {
  const { title, description, content, ...rest } = props;
  return (
    <VStack alignItems="start">
      <Dialog.Root
        {...rest}
        key={"center"}
        placement={"center"}
        size={"md"}
        motionPreset="slide-in-bottom"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content p={5}>
              {title && (
                <Dialog.Header>
                  <Dialog.Title>{title}</Dialog.Title>
                </Dialog.Header>
              )}
              <Dialog.Body p={5}>
                {description && (
                  <Dialog.Description>{description}</Dialog.Description>
                )}
                {content}
              </Dialog.Body>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </VStack>
  );
});

export default function Home() {
  const {
    isAuthenticated,
    derivedKeyMaterial,
    hardwareInit,
    userId,
    basicNuc,
  } = useZkLogin();
  const [nuc, setNuc] = useState<NucTokenEnvelope | null>(null);
  useEffect(() => {
    (async () => {
      const myNuc = await basicNuc(userId as string);
      setNuc(myNuc);
    })();
  }, [derivedKeyMaterial]);

  const steps = [
    {
      title: `Social Login`,
      description: `Log in to Google. This provides unique properties known only to Google and this app administrator.`,
    },
    {
      title: `Hardware Login`,
      description: `Authenticate with your passkey. This provides cryptographic fingerprints that can only be created by this hardware.`,
    },
    {
      title: `Approve Usage`,
      description: `Designate usage rights of your app.`,
    },
  ];

  return (
    <>
      <Head>
        <title>SecretVault Sign In</title>
        <meta name="description" content="Simple starter app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}
      >
        <main className={styles.main}>
          <Center p={8}>
            <VStack>
              <Image
                className={styles.logo}
                src="/logo.svg"
                alt="NilDog logo"
                width={180}
                height={38}
                priority
              />
              <Separator />
              <Steps.Root
                width="600px"
                count={steps.length}
                step={derivedKeyMaterial ? 2 : isAuthenticated ? 1 : 0}
              >
                <Steps.List>
                  {steps.map((step, index) => (
                    <Steps.Item key={index} index={index} title={step.title}>
                      <Steps.Indicator />
                      <Steps.Title>{step.title}</Steps.Title>
                      <Steps.Separator />
                    </Steps.Item>
                  ))}
                </Steps.List>
                {steps.map((step, index) => (
                  <Steps.Content key={index} index={index}>
                    <Center>{step.description}</Center>
                  </Steps.Content>
                ))}
                <Steps.CompletedContent>
                  All steps are complete!
                </Steps.CompletedContent>
              </Steps.Root>

              <Separator />
              <HStack>
                {derivedKeyMaterial ? (
                  <VStack>
                    <Button
                      p={5}
                      variant="outline"
                      onClick={async () => {
                        dialog.open("a", {
                          title: "Configure usage rights",
                          content: <PermissionRadioCards />,
                        });
                      }}
                    >
                      <FcDataConfiguration /> Configure usage rights
                    </Button>
                    <dialog.Viewport />
                    <Separator />
                    <Button
                      p={5}
                      variant="outline"
                      onClick={async () => {
                        dialog.open("a", {
                          title: "Your nuc",
                          content: nuc && JSON.stringify(nuc?.token, null, 4),
                        });
                      }}
                    >
                      <FcInfo /> View nuc
                    </Button>
                  </VStack>
                ) : isAuthenticated ? (
                  <Button p={5} variant="outline" onClick={hardwareInit}>
                    <>
                      <FcKey /> Unlock Hardware Key
                    </>
                  </Button>
                ) : (
                  <Button asChild p={5} variant="outline">
                    <>
                      <FcGoogle />{" "}
                      <a href="/api/login/google">Sign in with Google</a>
                    </>
                  </Button>
                )}
              </HStack>
            </VStack>
          </Center>
        </main>
        <footer className={styles.footer}>
          <a
            href="https://docs.nillion.com/build/secret-vault"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
            />
            Learn
          </a>
          <a
            href="https://github.com/NillionNetwork/nildb-browser-demos"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/window.svg"
              alt="Window icon"
              width={16}
              height={16}
            />
            Examples
          </a>
          <a
            href="https://www.nillion.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
            />
            Go to nillion.com →
          </a>
        </footer>
      </div>
    </>
  );
}
