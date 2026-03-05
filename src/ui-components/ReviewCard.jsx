import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Image, Text, Icon, Divider, Badge, Rating } from '@aws-amplify/ui-react';


export default function ReviewCard(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="0"
    direction="row"
    width="960px"
    justifyContent="flex-start"
    alignItems="center"
    position="relative"
    {...getOverrideProps(overrides, "ReviewCard")}
    {...rest}
  >
    <Image
      width="400px"
      height="351px"
      display="block"
      shrink="0"
      position="relative"
      objectFit="cover"
      alt=""
      {...getOverrideProps(overrides, "image")}
    />
    <Flex
      gap="24px"
      direction="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      grow="1"
      shrink="1"
      basis="0"
      alignSelf="stretch"
      position="relative"
      padding="32px 32px 32px 32px"
      backgroundColor="rgba(255,255,255,1)"
      {...getOverrideProps(overrides, "Card Area")}
    >
      <Flex
        gap="8px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Title")}
      >
        <Flex
          gap="8px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          {...getOverrideProps(overrides, "Frame")}
        >
          <Text
            fontFamily="Inter"
            fontSize="14px"
            fontWeight="400"
            color="rgba(92,102,112,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            grow="1"
            shrink="1"
            basis="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Information about this product")}
          >
            Information about this product
          </Text>
          <Flex
            width="24px"
            height="24px"
            overflow="hidden"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "Icon")}
          >
            <Icon
              width="20px"
              height="18.35px"
              viewBox={{"minX":0,"minY":0,"width":20,"height":18.350000381469727}}
              paths={[{"d":"M 14.5 0 C 12.759999990463257 0 11.090000033378601 0.8100001811981201 10 2.0900001525878906 C 8.909999966621399 0.8100001811981201 7.240000009536743 0 5.5 0 C 2.4200000762939453 0 0 2.4200000762939453 0 5.5 C 0 9.27999997138977 3.4000000953674316 12.36000108718872 8.550000190734863 17.040000915527344 L 10 18.350000381469727 L 11.449999809265137 17.030000686645508 C 16.59999990463257 12.360000610351562 20 9.27999997138977 20 5.5 C 20 2.4200000762939453 17.579999923706055 0 14.5 0 Z M 10.100000381469727 15.549999237060547 L 10 15.649999618530273 L 9.899999618530273 15.549999237060547 C 5.1399993896484375 11.239999294281006 2 8.390000104904175 2 5.5 C 2 3.5 3.5 2 5.5 2 C 7.039999961853027 2 8.539999723434448 2.9900001287460327 9.069999694824219 4.360000133514404 L 10.9399995803833 4.360000133514404 C 11.459999561309814 2.9900001287460327 12.960000038146973 2 14.5 2 C 16.5 2 18 3.5 18 5.5 C 18 8.390000104904175 14.860000610351562 11.239999294281006 10.100000381469727 15.549999237060547 Z","fillRule":"nonzero"},{"d":"M14.5 0 C12.76 0 11.09 0.81 10 2.09 C8.91 0.81 7.24 0 5.5 0 C2.42 0 0 2.42 0 5.5 C0 9.28 3.4 12.36 8.55 17.04 L10 18.35 L11.45 17.03 C16.6 12.36 20 9.28 20 5.5 C20 2.42 17.58 0 14.5 0 Z M10.1 15.55 L10 15.65 L9.9 15.55 C5.14 11.24 2 8.39 2 5.5 C2 3.5 3.5 2 5.5 2 C7.04 2 8.54 2.99 9.07 4.36 L10.94 4.36 C11.46 2.99 12.96 2 14.5 2 C16.5 2 18 3.5 18 5.5 C18 8.39 14.86 11.24 10.1 15.55 Z","fill":"rgba(13,26,38,1)","fillRule":"nonzero"}]}
              display="block"
              position="absolute"
              top="12.5%"
              bottom="11.04%"
              left="8.33%"
              right="8.33%"
              {...getOverrideProps(overrides, "Vector")}
            />
          </Flex>
        </Flex>
        <Text
          fontFamily="Inter"
          fontSize="20px"
          fontWeight="700"
          color="rgba(13,26,38,1)"
          lineHeight="25px"
          textAlign="left"
          display="block"
          shrink="0"
          alignSelf="stretch"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "Classic Long Sleeve T-Shirt")}
        >
          Classic Long Sleeve T-Shirt
        </Text>
      </Flex>
      <Divider
        width="40px"
        height="1px"
        shrink="0"
        size="small"
        orientation="horizontal"
        {...getOverrideProps(overrides, "Divider")}
      />
      <Flex
        gap="8px"
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Features")}
      >
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
          {...getOverrideProps(overrides, "Information about this product.29766836")}
        >
          Information about this product.
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
          {...getOverrideProps(overrides, "Information about this product.29766837")}
        >
          Information about this product.
        </Text>
      </Flex>
      <Badge
        shrink="0"
        size="small"
        variation="default"
        {...getOverrideProps(overrides, "Badge")}
      >
        New!
      </Badge>
      <Flex
        gap="16px"
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Bottom Row")}
      >
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="center"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Rating29766840")}
        >
          <Rating
            shrink="0"
            size="large"
            {...getOverrideProps(overrides, "Rating29766841")}
          />
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(13,26,38,1)"
            lineHeight="22px"
            textAlign="left"
            display="block"
            textDecoration="underline"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Reviews")}
          >
            Reviews
          </Text>
        </Flex>
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="700"
          color="rgba(13,26,38,1)"
          lineHeight="20px"
          textAlign="right"
          display="block"
          grow="1"
          shrink="1"
          basis="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "$99/Night")}
        >
          $99/Night
        </Text>
      </Flex>
    </Flex>
  </Flex>
  )
}
