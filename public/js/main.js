document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
  }
});
const phoneNum=document.getElementById("phone");
const message=document.getElementById("message");
form.addEventListener('submit',async(e)=>{
  e.preventDefault();
  const phone=phoneNum.value.trim();
  const phoneRegex=/^\d{9}$/;
  if(!phoneRegex.test(phone)){
    message.textContent="Invalid phone number(must be exactly 10 digits";
    message.className="error";
    return;
  }
})

