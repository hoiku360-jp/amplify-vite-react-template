import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Image, Text, Divider, Rating, Button } from '@aws-amplify/ui-react';


export default function ProductDetail(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="24px"
    direction="row"
    width="1160px"
    justifyContent="flex-start"
    alignItems="flex-start"
    position="relative"
    {...getOverrideProps(overrides, "ProductDetail")}
    {...rest}
  >
    <Flex
      gap="32px"
      direction="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      grow="1"
      shrink="1"
      basis="0"
      position="relative"
      {...getOverrideProps(overrides, "Frame 401")}
    >
      <Image
        height="740px"
        display="block"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        objectFit="cover"
        alt=""
        {...getOverrideProps(overrides, "image")}
      />
      <Flex
        gap="32px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Frame 6")}
      >
        <Flex
          gap="8px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 729766954")}
        >
          <Text
            fontFamily="Inter"
            fontSize="24px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="36px"
            textAlign="left"
            display="block"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Basic Tee 6-Pack")}
          >
            Basic Tee 6-Pack
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(92,102,112,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in voluptate velit esse cillum dolore eu fugiat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in voluptate velit esse cillum dolore eu fugiat.")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in voluptate velit esse cillum dolore eu fugiat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in voluptate velit esse cillum dolore eu fugiat.
          </Text>
        </Flex>
        <Divider
          height="1px"
          shrink="0"
          alignSelf="stretch"
          size="small"
          orientation="horizontal"
          {...getOverrideProps(overrides, "Divider29766957")}
        />
        <Flex
          gap="8px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 729766958")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Highlights")}
          >
            Highlights
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(92,102,112,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Hand cut and sewn locally Dyed with our proprietary colors Pre-washed & pre-shrunk Ultra-soft 100% cotton")}
          >
                Hand cut and sewn locally
    Dyed with our proprietary colors
    Pre-washed & pre-shrunk
    Ultra-soft 100% cotton
          </Text>
        </Flex>
        <Divider
          height="1px"
          shrink="0"
          alignSelf="stretch"
          size="small"
          orientation="horizontal"
          {...getOverrideProps(overrides, "Divider29766961")}
        />
        <Flex
          gap="8px"
          direction="column"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame 729766962")}
        >
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="600"
            color="rgba(13,26,38,1)"
            lineHeight="20px"
            textAlign="left"
            display="block"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Details")}
          >
            Details
          </Text>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(92,102,112,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            shrink="0"
            alignSelf="stretch"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor.")}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor.
          </Text>
        </Flex>
      </Flex>
    </Flex>
    <Flex
      gap="24px"
      direction="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      shrink="0"
      position="relative"
      {...getOverrideProps(overrides, "Frame 402")}
    >
      <Text
        fontFamily="Inter"
        fontSize="24px"
        fontWeight="600"
        color="rgba(13,26,38,1)"
        lineHeight="30px"
        textAlign="left"
        display="block"
        shrink="0"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "$192")}
      >
        $192
      </Text>
      <Flex
        gap="16px"
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Frame 2729766968")}
      >
        <Rating
          shrink="0"
          size="default"
          {...getOverrideProps(overrides, "Rating")}
        />
        <Text
          fontFamily="Inter"
          fontSize="14px"
          fontWeight="400"
          color="rgba(13,26,38,1)"
          lineHeight="18px"
          textAlign="left"
          display="block"
          textDecoration="underline"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "12 reviews")}
        >
          12 reviews
        </Text>
      </Flex>
      <Flex
        gap="16px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Frame 2729766971")}
      >
        <Text
          fontFamily="Inter"
          fontSize="14px"
          fontWeight="400"
          color="rgba(13,26,38,1)"
          lineHeight="18px"
          textAlign="right"
          display="block"
          textDecoration="underline"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Size Guide")}
        >
          Size Guide
        </Text>
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(13,26,38,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Size")}
        >
          Size 
        </Text>
        <Flex
          gap="24px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Frame 2829766973")}
        >
          <Button
            width="85px"
            shrink="0"
            size="default"
            isDisabled={true}
            variation="default"
            {...getOverrideProps(overrides, "Button29766974")}
          >
            XXS
          </Button>
          <Button
            width="87px"
            shrink="0"
            size="default"
            isDisabled={false}
            variation="default"
            {...getOverrideProps(overrides, "Button29766975")}
          >
            XS
          </Button>
          <Button
            width="87px"
            shrink="0"
            size="default"
            isDisabled={false}
            variation="default"
            {...getOverrideProps(overrides, "Button29766976")}
          >
            S
          </Button>
          <Button
            width="87px"
            shrink="0"
            size="default"
            isDisabled={false}
            variation="default"
            {...getOverrideProps(overrides, "Button29766977")}
          >
            M
          </Button>
        </Flex>
        <Flex
          gap="24px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Frame 2829766978")}
        >
          <Button
            width="87px"
            gap="24px"
            shrink="0"
            size="default"
            isDisabled={false}
            variation="default"
            {...getOverrideProps(overrides, "Button29766979")}
          >
            L
          </Button>
          <Button
            width="87px"
            gap="24px"
            shrink="0"
            size="default"
            isDisabled={false}
            variation="default"
            {...getOverrideProps(overrides, "Button29766980")}
          >
            XL
          </Button>
          <Button
            width="87px"
            gap="24px"
            shrink="0"
            size="default"
            isDisabled={false}
            variation="default"
            {...getOverrideProps(overrides, "Button29766981")}
          >
            2XL
          </Button>
          <Button
            width="87px"
            gap="24px"
            shrink="0"
            size="default"
            isDisabled={false}
            variation="default"
            {...getOverrideProps(overrides, "Button29766982")}
          >
            3XL
          </Button>
        </Flex>
        <Button
          shrink="0"
          alignSelf="stretch"
          size="large"
          isDisabled={false}
          variation="primary"
          {...getOverrideProps(overrides, "Button29766972")}
        >
          Add to cart
        </Button>
      </Flex>
    </Flex>
  </Flex>
  )
}
