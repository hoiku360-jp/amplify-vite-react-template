import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Text, Button } from '@aws-amplify/ui-react';
import MyIcon from './MyIcon';

export default function MarketingPricing(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="24px"
    direction="column"
    width="1440px"
    justifyContent="flex-start"
    alignItems="center"
    overflow="hidden"
    position="relative"
    padding="48px 48px 48px 48px"
    backgroundColor="rgba(250,250,250,1)"
    {...getOverrideProps(overrides, "MarketingPricing")}
    {...rest}
  >
    <Flex
      gap="12px"
      direction="column"
      justifyContent="flex-start"
      alignItems="center"
      shrink="0"
      position="relative"
      {...getOverrideProps(overrides, "Frame 432")}
    >
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="600"
        color="rgba(4,125,149,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Pricing")}
      >
        Pricing
      </Text>
      <Text
        fontFamily="Inter"
        fontSize="32px"
        fontWeight="600"
        color="rgba(13,26,38,1)"
        lineHeight="32px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Choose your plan")}
      >
        Choose your plan
      </Text>
      <Text
        fontFamily="Inter"
        fontSize="16px"
        fontWeight="400"
        color="rgba(92,102,112,1)"
        lineHeight="24px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "14 day free trial for any plan, no credit card needed")}
      >
        14 day free trial for any plan, no credit card needed
      </Text>
    </Flex>
    <Flex
      gap="24px"
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      alignSelf="stretch"
      position="relative"
      {...getOverrideProps(overrides, "Frame 63")}
    >
      <Flex
        gap="24px"
        direction="column"
        justifyContent="center"
        alignItems="center"
        grow="1"
        shrink="1"
        basis="0"
        position="relative"
        boxShadow="0px 2px 4px rgba(0.05098039284348488, 0.10196078568696976, 0.14901961386203766, 0.05000000074505806)"
        borderRadius="8px"
        padding="32px 32px 32px 32px"
        backgroundColor="rgba(255,255,255,1)"
        {...getOverrideProps(overrides, "Frame 39029766683")}
      >
        <Flex
          gap="8px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Frame 42939393278")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(4,125,149,1)"
            lineHeight="30px"
            textAlign="center"
            display="block"
            width="400px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Free plan")}
          >
            Free plan
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="32px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="25px"
            textAlign="center"
            display="block"
            width="400px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "$0/mo")}
          >
            $0/mo
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(92,102,112,1)"
            lineHeight="25px"
            textAlign="center"
            display="block"
            width="400px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Free forever, always")}
          >
            Free forever, always
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 13829766688")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43039393324")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39393299")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.29766691")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 13929766692")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43139393330")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39393331")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.29766695")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 13729766696")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43039393348")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39393349")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.29766699")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
          </Text>
        </Flex>
        <Button
          shrink="0"
          alignSelf="stretch"
          size="large"
          isDisabled={false}
          variation="primary"
          {...getOverrideProps(overrides, "Button29766686")}
        >
          Get started
        </Button>
      </Flex>
      <Flex
        gap="24px"
        direction="column"
        justifyContent="center"
        alignItems="center"
        grow="1"
        shrink="1"
        basis="0"
        position="relative"
        boxShadow="0px 2px 4px rgba(0.05098039284348488, 0.10196078568696976, 0.14901961386203766, 0.05000000074505806)"
        borderRadius="8px"
        padding="32px 32px 32px 32px"
        backgroundColor="rgba(255,255,255,1)"
        {...getOverrideProps(overrides, "Frame 39039393391")}
      >
        <Flex
          gap="8px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Frame 42939393392")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(4,125,149,1)"
            lineHeight="30px"
            textAlign="center"
            display="block"
            width="400px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Basic plan")}
          >
            Basic plan
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="32px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="25px"
            textAlign="center"
            display="block"
            width="400px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "$20/mo")}
          >
            $20/mo
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(92,102,112,1)"
            lineHeight="25px"
            textAlign="center"
            display="block"
            width="400px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Billed annually39393395")}
          >
            Billed annually
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 13839393396")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43039393397")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39393398")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.39393399")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 13939393400")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43139393401")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39393402")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.39393403")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 13739393404")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43039393405")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39393406")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.39393407")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
          </Text>
        </Flex>
        <Button
          shrink="0"
          alignSelf="stretch"
          size="large"
          isDisabled={false}
          variation="primary"
          {...getOverrideProps(overrides, "Button39393408")}
        >
          Get started
        </Button>
      </Flex>
      <Flex
        gap="24px"
        direction="column"
        justifyContent="center"
        alignItems="center"
        grow="1"
        shrink="1"
        basis="0"
        position="relative"
        boxShadow="0px 2px 4px rgba(0.05098039284348488, 0.10196078568696976, 0.14901961386203766, 0.05000000074505806)"
        borderRadius="8px"
        padding="32px 32px 32px 32px"
        backgroundColor="rgba(255,255,255,1)"
        {...getOverrideProps(overrides, "Frame 391")}
      >
        <Flex
          gap="8px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Frame 42939393608")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(4,125,149,1)"
            lineHeight="30px"
            textAlign="center"
            display="block"
            width="400px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Pro plan")}
          >
            Pro plan
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="32px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="25px"
            textAlign="center"
            display="block"
            width="400px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "$100/mo")}
          >
            $100/mo
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(92,102,112,1)"
            lineHeight="25px"
            textAlign="center"
            display="block"
            width="400px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Billed annually39393611")}
          >
            Billed annually
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 13839393612")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43039393613")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39393614")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.39393615")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 13939393616")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43139393617")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39393618")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.39393619")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 13739393620")}
        >
          <Flex
            gap="0"
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            shrink="0"
            position="relative"
            borderRadius="8px"
            padding="8px 8px 8px 8px"
            backgroundColor="rgba(233,249,252,1)"
            {...getOverrideProps(overrides, "Frame 43039393621")}
          >
            <MyIcon
              type="checkmark"
              {...getOverrideProps(overrides, "MyIcon39393622")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.39393623")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
          </Text>
        </Flex>
        <Button
          shrink="0"
          alignSelf="stretch"
          size="large"
          isDisabled={false}
          variation="primary"
          {...getOverrideProps(overrides, "Button39393624")}
        >
          Get started
        </Button>
      </Flex>
    </Flex>
  </Flex>
  )
}
