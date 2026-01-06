// SET UP APPLE PAY BUTTON
if (!window.ApplePaySession) {
    console.error('This device does not support Apple Pay');
}
if (!ApplePaySession.canMakePayments()) {
    console.error('This device is not capable of making Apple Pay payments');
}
const applepay = paypal.Applepay();
applepay.config()
    .then(applepayConfig => {
        if (applepayConfig.isEligible) {
            document.getElementById("applepay-container").innerHTML = '<apple-pay-button id="btn-appl" buttonstyle="black" type="buy" locale="en">';
        }
    })
    .catch(applepayConfigError => {
        console.error('Error while fetching Apple Pay configuration.');
    });


// CREATE APPLE PAY SESSION
const paymentRequest = {
    countryCode: applepayConfig.countryCode,
    merchantCapabilities: applepayConfig.merchantCapabilities,
    supportedNetworks: applepayConfig.supportedNetworks,
    currencyCode: "USD",
    requiredShippingContactFields: ["name", "phone", "email", "postalAddress"],
    requiredBillingContactFields: ["postalAddress"],
    total: {
        label: "Demo",
        type: "final",
        amount: "10.00",
    }
};
const session = new ApplePaySession(4, paymentRequest);

// CALLBACK onvalidatemerchant
session.onvalidatemerchant = (event) => {
    applepay.validateMerchant({
        validationUrl: event.validationURL,
        displayName: "My Store"
    })
        .then(validateResult => {
            session.completeMerchantValidation(validateResult.merchantSession);
        })
        .catch(validateError => {
            console.error(validateError);
            session.abort();
        });
};

// CALLBACK onpaymentauthorized 
session.onpaymentauthorized = (event) => {
    console.log('Your billing address is:', event.payment.billingContact);
    console.log('Your shipping address is:', event.payment.shippingContact);
    fetch("/api/orders", {
        method: 'post',
        body: {}
    })
        .then(res => res.json())
        .then((createOrderData) => {
            var orderId = createOrderData.id;
            applepay.confirmOrder({
                orderId: orderId,
                token: event.payment.token,
                billingContact: event.payment.billingContact
            })
                .then(confirmResult => {
                    session.completePayment(ApplePaySession.STATUS_SUCCESS);
                    fetch(`/api/orders/${orderId}/capture`, {
                        method: "post",
                    })
                        .then(res => res.json())
                        .then(captureResult => {
                            console.log(captureResult);
                        })
                        .catch(captureError => console.error(captureError));
                })
                .catch(confirmError => {
                    if (confirmError) {
                        console.error('Error confirming order with applepay token');
                        console.error(confirmError);
                        session.completePayment(ApplePaySession.STATUS_FAILURE);
                    }
                });
        });
};

// SHOW PAYMENT SHEET
session.begin();