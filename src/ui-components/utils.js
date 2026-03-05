
/* eslint-disable */
export const findChildOverrides = (overrides, elementHierarchy) => {
  if (!overrides) {
    return null;
  }
  const filteredOverrides = Object.entries(overrides).filter((m) =>
    m[0].startsWith(elementHierarchy)
  );
  return Object.assign(
    {},
    ...Array.from(filteredOverrides, ([k, v]) => ({
      [k.replace(elementHierarchy, "")]: v,
    }))
  );
};

export const getOverrideProps = (overrides, elementHierarchy) => {
  if (!overrides) {
    return null;
  }
  const componentOverrides = Object.entries(overrides)
    .filter(([key]) => key === elementHierarchy)
    .flatMap(([, value]) => Object.entries(value))
    .filter((m) => m?.[0]);
  return Object.fromEntries(componentOverrides);
};

export const getOverridesFromVariants = (variants, props) => {
  const variantValueKeys = [
    ...new Set(
      variants.flatMap((variant) => Object.keys(variant.variantValues))
    ),
  ];
  const variantValuesFromProps = Object.keys(props)
    .filter((i) => variantValueKeys.includes(i) && props[i])
    .reduce((acc, key) => {
      return {
        ...acc,
        [key]: props[key],
      };
    }, {});
  const matchedVariants = variants.filter(({ variantValues }) => {
    return (
      Object.keys(variantValues).length ===
        Object.keys(variantValuesFromProps).length &&
      Object.entries(variantValues).every(
        ([key, value]) => variantValuesFromProps[key] === value
      )
    );
  });
  return matchedVariants.reduce((overrides, variant) => {
    return { ...overrides, ...variant.overrides };
  }, {});
}

export const mergeVariantsAndOverrides = (variants, overrides) => {
  if (!variants && !overrides) {
    return null;
  }
  if (!overrides) {
    return variants;
  }
  if (!variants) {
    return overrides;
  }
  const overrideKeys = new Set(Object.keys(overrides));
  const sharedKeys = Object.keys(variants).filter((variantKey) =>
    overrideKeys.has(variantKey)
  );
  const merged = Object.fromEntries(
    sharedKeys.map((sharedKey) => [
      sharedKey,
      { ...variants[sharedKey], ...overrides[sharedKey] },
    ])
  );
  return {
    ...variants,
    ...overrides,
    ...merged,
  };
};
