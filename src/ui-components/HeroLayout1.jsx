import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, Button, Image } from '@aws-amplify/ui-react';


export default function HeroLayout1(props) {
  const { overrides: overridesProp, ...rest } = props;
  const variants = [
  {
    "variantValues": {
      "mode": "Light"
    },
    "overrides": {
      "Eyebrow": {},
      "Heading": {},
      "Body": {},
      "Message": {},
      "Button": {},
      "HeroMessage": {},
      "Left": {},
      "image": {},
      "Right": {},
      "HeroLayout1": {}
    }
  },
  {
    "variantValues": {
      "mode": "Dark"
    },
    "overrides": {
      "Eyebrow": {
        "label": "Full-stack",
        "color": "rgba(188,236,245,1)"
      },
      "Heading": {
        "color": "rgba(255,255,255,1)"
      },
      "Body": {
        "color": "rgba(255,255,255,1)"
      },
      "Message": {},
      "Button": {},
      "HeroMessage": {},
      "Left": {
        "backgroundColor": "rgba(13,26,38,1)"
      },
      "image": {
        "width": "unset",
        "alignSelf": "stretch"
      },
      "Right": {},
      "HeroLayout1": {}
    }
  }
];
  
  const overrides = mergeVariantsAndOverrides(
    getOverridesFromVariants(variants, props),
    overridesProp || {}
  );

  return (
  <Flex
    gap="0"
    direction="row"
    width="1440px"
    justifyContent="center"
    alignItems="center"
    position="relative"
    {...getOverrideProps(overrides, "HeroLayout1")}
    {...rest}
  >
    <Flex
      gap="10px"
      direction="column"
      width="720px"
      justifyContent="center"
      alignItems="center"
      overflow="hidden"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      padding="120px 120px 120px 120px"
      backgroundColor="rgba(255,255,255,1)"
      {...getOverrideProps(overrides, "Left")}
    >
      <Flex
        gap="24px"
        direction="column"
        justifyContent="center"
        alignItems="center"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "HeroMessage")}
      >
        <Flex
          gap="16px"
          direction="column"
          justifyContent="center"
          alignItems="center"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Message")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="700"
            color="rgba(64,170,191,1)"
            lineHeight="24px"
            textAlign="center"
            display="block"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Eyebrow")}
          >
            Full stack
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="24px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="30px"
            textAlign="center"
            display="block"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Heading")}
          >
            Build full-stack web and mobile apps in hours. Easy to start, easy to scale
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(48,64,80,1)"
            lineHeight="24px"
            textAlign="center"
            display="block"
            letterSpacing="0.01px"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Body")}
          >
            AWS Amplify is a complete solution that lets frontend web and mobile developers easily build, ship, and host full-stack applications on AWS, with the flexibility to leverage the breadth of AWS services as use cases evolve. No cloud expertise needed.
          </Text>
        </Flex>
        <Button
          shrink="0"
          size="large"
          isDisabled={false}
          variation="primary"
          {...getOverrideProps(overrides, "Button")}
        >
          Get started
        </Button>
      </Flex>
    </Flex>
    <Flex
      gap="10px"
      direction="column"
      width="720px"
      justifyContent="center"
      alignItems="center"
      overflow="hidden"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Right")}
    >
      <Image
        width="720px"
        display="block"
        grow="1"
        shrink="1"
        basis="0"
        position="relative"
        alt=""
        {...getOverrideProps(overrides, "image")}
      />
    </Flex>
  </Flex>
  )
}
