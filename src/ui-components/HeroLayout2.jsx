import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, Button } from '@aws-amplify/ui-react';


export default function HeroLayout2(props) {
  const { overrides: overridesProp, ...rest } = props;
  const variants = [
  {
    "variantValues": {
      "colorMode": "Default"
    },
    "overrides": {
      "Full stack": {},
      "Build full-stack web and mobile apps in hours. Easy to start, easy to scale": {},
      "AWS Amplify is a complete solution that lets frontend web and mobile developers easily build, ship, and host full-stack applications on AWS, with the flexibility to leverage the breadth of AWS services as use cases evolve. No cloud expertise needed.": {},
      "Main Body": {},
      "Button": {},
      "Type Lock Up": {},
      "HeroLayout2": {}
    }
  },
  {
    "variantValues": {
      "colorMode": "dark"
    },
    "overrides": {
      "Full stack": {
        "color": "rgba(249,184,249,1)"
      },
      "Build full-stack web and mobile apps in hours. Easy to start, easy to scale": {
        "color": "rgba(233,249,252,1)"
      },
      "AWS Amplify is a complete solution that lets frontend web and mobile developers easily build, ship, and host full-stack applications on AWS, with the flexibility to leverage the breadth of AWS services as use cases evolve. No cloud expertise needed.": {
        "color": "rgba(188,236,245,1)"
      },
      "Main Body": {},
      "Button": {},
      "Type Lock Up": {},
      "HeroLayout2": {
        "backgroundColor": "rgba(0,64,77,1)"
      }
    }
  }
];
  
  const overrides = mergeVariantsAndOverrides(
    getOverridesFromVariants(variants, props),
    overridesProp || {}
  );

  return (
  <Flex
    gap="10px"
    direction="column"
    width="1440px"
    height="548px"
    justifyContent="center"
    alignItems="center"
    overflow="hidden"
    position="relative"
    padding="160px 240px 160px 240px"
    backgroundColor="rgba(233,249,252,1)"
    {...getOverrideProps(overrides, "HeroLayout2")}
    {...rest}
  >
    <Flex
      gap="24px"
      direction="column"
      justifyContent="center"
      alignItems="center"
      grow="1"
      shrink="1"
      basis="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Type Lock Up")}
    >
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="700"
        color="rgba(4,125,149,1)"
        lineHeight="24px"
        textAlign="center"
        display="block"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Full stack")}
      >
        Full stack
      </Text>
      <Flex
        gap="16px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Main Body")}
      >
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
          {...getOverrideProps(overrides, "Build full-stack web and mobile apps in hours. Easy to start, easy to scale")}
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
          {...getOverrideProps(overrides, "AWS Amplify is a complete solution that lets frontend web and mobile developers easily build, ship, and host full-stack applications on AWS, with the flexibility to leverage the breadth of AWS services as use cases evolve. No cloud expertise needed.")}
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
  )
}
