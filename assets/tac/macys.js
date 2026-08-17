// Define constants
const MACYS_URL = 'https://www.macys.com';
const PROMO_CODE_URL = '/my-bag/{bagGuid}/promo';
const PROMO_CODE_URL_WITH_CODE = `${PROMO_CODE_URL}?promoCode={promoCode}`;
const SHIPPING_SELECTOR = '#international-shipping .shipping-country.us-country';
const BAG_GUID_COOKIE = /macys_bagguid=(.*?);/;
const SUBTOTAL_LABEL = 'Subtotal';
const PRE_TAX_ORDER_TOTAL_LABEL = 'Pre-Tax Order Total';

async function applyOrRemoveCode(promoCode, utils, action) {
  // Get bag GUID from cookie
  const bagGuidMatch = document.cookie.match(BAG_GUID_COOKIE);
  const bagGuid = bagGuidMatch ? bagGuidMatch[1] : null;

  const applyCodeUrl = `${MACYS_URL}${PROMO_CODE_URL_WITH_CODE}`.replace('{bagGuid}', bagGuid).replace('{promoCode}', promoCode);
  const removeCodeUrl = `${MACYS_URL}${PROMO_CODE_URL.replace('{bagGuid}', bagGuid)}`;
  const promoUrl = action === 'apply' ? applyCodeUrl : removeCodeUrl;

  try {
    const response = await $.ajax({
      url: promoUrl,
      type: 'PUT',
      data: {},
    });

    utils.logger.debug(`Finished running ${action} code`);
    return response;
  } catch (error) {
    utils.logger.debug(`Coupon ${action} error: ${error}`);
    return null;
  }
}

async function updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils) {
  const shippingElement = $(SHIPPING_SELECTOR);
  const hasShippingElement = shippingElement.length > 0;
  let newPrice;

  try {
    const priceSection = applyCodeResponse.bag.sections.summary.price;
    const labelType = hasShippingElement ? SUBTOTAL_LABEL : PRE_TAX_ORDER_TOTAL_LABEL;
    const priceKey = Object.keys(priceSection || {}).find((key) => priceSection[key]?.label === labelType);
    newPrice = priceKey ? priceSection[priceKey].values[0]?.formattedValue : originalPrice;
  } catch (error) {
    utils.logger.debug(`Error updating price: ${error}`);
    newPrice = originalPrice;
  }

  if (Number(utils.parsePrice(newPrice)) < originalPrice) {
    $(cartPriceSelector).text(newPrice);
  }

  return newPrice;
}

async function tacSubmit({ utils, promoCode, runState, cartPriceSelector, currentPrice }) {
  const applyCodeResponse = await applyOrRemoveCode(promoCode, utils, 'apply');
  const originalPrice = runState.basePrice;
  let finalPrice = currentPrice;
  let successfulCode = true;

  try {
    const hasErrorResponse = applyCodeResponse.bag.sections.bagPromotions.meta.messages.error;
    if (hasErrorResponse) {
      successfulCode = false;
    }
  } catch (error) {
    utils.logger.debug(error);
  }
  finalPrice = await updatePrice(applyCodeResponse, cartPriceSelector, originalPrice, utils);
  if (successfulCode) {
    await applyOrRemoveCode(promoCode, utils, 'remove');
  }

  return {
    totalPrice: Number(utils.parsePrice(finalPrice)),
    applyBestWithAction: true,
  };
}

window.tacSubmit = tacSubmit;
