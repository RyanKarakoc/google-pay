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