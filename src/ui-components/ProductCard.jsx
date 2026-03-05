import * as React from "react";
import {
  getOverrideProps,
  getOverridesFromVariants,
  mergeVariantsAndOverrides,
} from "./utils";
import { Flex, Image, Text, Rating, Badge, Divider, Icon } from '@aws-amplify/ui-react';
import MyIcon from './MyIcon';

export default function ProductCard(props) {
  const { overrides, ...rest } = props;

  return (
  <Flex
    gap="0"
    direction="row"
    width="960px"
    justifyContent="flex-start"
    alignItems="flex-start"
    position="relative"
    {...getOverrideProps(overrides, "ProductCard")}
    {...rest}
  >
    <Image
      width="320px"
      display="block"
      shrink="0"
      alignSelf="stretch"
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
      position="relative"
      padding="32px 32px 32px 32px"
      backgroundColor="rgba(255,255,255,1)"
      {...getOverrideProps(overrides, "Card Area")}
    >
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
      <Flex
        gap="16px"
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Ratings")}
      >
        <Rating
          shrink="0"
          size="large"
          {...getOverrideProps(overrides, "Rating")}
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
          width="19px"
          shrink="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "72")}
        >
          72
        </Text>
      </Flex>
      <Flex
        gap="16px"
        direction="row"
        justifyContent="flex-start"
        alignItems="center"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Tags")}
      >
        <Badge
          shrink="0"
          size="small"
          variation="default"
          {...getOverrideProps(overrides, "Badge29766804")}
        >
          New
        </Badge>
        <Badge
          shrink="0"
          size="small"
          variation="default"
          {...getOverrideProps(overrides, "Badge29766805")}
        >
          Classic
        </Badge>
        <Badge
          shrink="0"
          size="small"
          variation="default"
          {...getOverrideProps(overrides, "Badge29766806")}
        >
          Modern
        </Badge>
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
        shrink="0"
        alignSelf="stretch"
        position="relative"
        whiteSpace="pre-wrap"
        {...getOverrideProps(overrides, "Information about this product.")}
      >
        Information about this product.
      </Text>
      <Flex
        gap="16px"
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        alignSelf="stretch"
        position="relative"
        {...getOverrideProps(overrides, "Quote")}
      >
        <MyIcon
          type="chat"
          {...getOverrideProps(overrides, "MyIcon")}
        />
        <Text
          fontFamily="Inter"
          fontSize="16px"
          fontWeight="400"
          color="rgba(48,64,80,1)"
          lineHeight="24px"
          textAlign="left"
          display="block"
          letterSpacing="0.01px"
          grow="1"
          shrink="1"
          basis="0"
          position="relative"
          whiteSpace="pre-wrap"
          {...getOverrideProps(overrides, "“This is a quote.“")}
        >
          “This is a quote.“
        </Text>
      </Flex>
      <Divider
        height="1px"
        shrink="0"
        alignSelf="stretch"
        size="small"
        orientation="horizontal"
        {...getOverrideProps(overrides, "Divider")}
      />
      <Flex
        gap="32px"
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        shrink="0"
        position="relative"
        {...getOverrideProps(overrides, "Features")}
      >
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Feature29766813")}
        >
          <Flex
            width="24px"
            height="24px"
            overflow="hidden"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "Icon29766814")}
          >
            <Icon
              width="17.59px"
              height="13.41px"
              viewBox={{"minX":0,"minY":0,"width":17.59000015258789,"height":13.40999984741211}}
              paths={[{"d":"M 5.590000152587891 10.579999923706055 L 1.4199998378753662 6.409999847412109 L 0 7.819999694824219 L 5.590000152587891 13.40999984741211 L 17.59000015258789 1.4099998474121094 L 16.18000030517578 0 L 5.590000152587891 10.579999923706055 Z","fillRule":"nonzero"},{"d":"M5.59 10.58 L1.42 6.41 L0 7.82 L5.59 13.41 L17.59 1.41 L16.18 0 L5.59 10.58 Z","fill":"rgba(67,168,84,1)","fillRule":"nonzero"}]}
              display="block"
              position="absolute"
              top="23.29%"
              bottom="20.83%"
              left="14.21%"
              right="12.5%"
              {...getOverrideProps(overrides, "Vector29766815")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(48,64,80,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Fast")}
          >
            Fast
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Feature29766817")}
        >
          <Flex
            width="24px"
            height="24px"
            overflow="hidden"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "Icon29766818")}
          >
            <Icon
              width="17.59px"
              height="13.41px"
              viewBox={{"minX":0,"minY":0,"width":17.59000015258789,"height":13.40999984741211}}
              paths={[{"d":"M 5.590000152587891 10.579999923706055 L 1.4199998378753662 6.409999847412109 L 0 7.819999694824219 L 5.590000152587891 13.40999984741211 L 17.59000015258789 1.4099998474121094 L 16.18000030517578 0 L 5.590000152587891 10.579999923706055 Z","fillRule":"nonzero"},{"d":"M5.59 10.58 L1.42 6.41 L0 7.82 L5.59 13.41 L17.59 1.41 L16.18 0 L5.59 10.58 Z","fill":"rgba(67,168,84,1)","fillRule":"nonzero"}]}
              display="block"
              position="absolute"
              top="23.29%"
              bottom="20.83%"
              left="14.21%"
              right="12.5%"
              {...getOverrideProps(overrides, "Vector29766819")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(48,64,80,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Fun")}
          >
            Fun
          </Text>
        </Flex>
        <Flex
          gap="16px"
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          shrink="0"
          position="relative"
          {...getOverrideProps(overrides, "Feature29766821")}
        >
          <Flex
            width="24px"
            height="24px"
            overflow="hidden"
            shrink="0"
            position="relative"
            {...getOverrideProps(overrides, "Icon29766822")}
          >
            <Icon
              width="17.59px"
              height="13.41px"
              viewBox={{"minX":0,"minY":0,"width":17.59000015258789,"height":13.40999984741211}}
              paths={[{"d":"M 5.590000152587891 10.579999923706055 L 1.4199998378753662 6.409999847412109 L 0 7.819999694824219 L 5.590000152587891 13.40999984741211 L 17.59000015258789 1.4099998474121094 L 16.18000030517578 0 L 5.590000152587891 10.579999923706055 Z","fillRule":"nonzero"},{"d":"M5.59 10.58 L1.42 6.41 L0 7.82 L5.59 13.41 L17.59 1.41 L16.18 0 L5.59 10.58 Z","fill":"rgba(67,168,84,1)","fillRule":"nonzero"}]}
              display="block"
              position="absolute"
              top="23.29%"
              bottom="20.83%"
              left="14.21%"
              right="12.5%"
              {...getOverrideProps(overrides, "Vector29766823")}
            />
          </Flex>
          <Text
            fontFamily="Inter"
            fontSize="16px"
            fontWeight="400"
            color="rgba(48,64,80,1)"
            lineHeight="24px"
            textAlign="left"
            display="block"
            letterSpacing="0.01px"
            shrink="0"
            position="relative"
            whiteSpace="pre-wrap"
            {...getOverrideProps(overrides, "Flirty")}
          >
            Flirty
          </Text>
        </Flex>
      </Flex>
    </Flex>
  </Flex>
  )
}
