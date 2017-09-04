
$(document).ready(function() {
	$('#auth-yes').hide();
	$('#unlocked').hide();
	$('#btn-authenticate').on("click", function() {
		$('#locked').hide();
		$('#unlocked').show();
		$('.panel').fadeOut(1500);
		$('#auth-no').hide();
		$('#auth-yes').show();
	});
});