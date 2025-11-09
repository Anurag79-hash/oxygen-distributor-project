    const form = document.getElementById('purchaseForm');
    const returnForm = document.getElementById('returnForm');
    const msg = document.getElementById('msg');
    const myOrders = document.getElementById('myOrder');

    const navPurchase = document.getElementById('navPurchase');
    const navReturn = document.getElementById('navReturn');

    // Toggle between purchase and return views
    navPurchase.addEventListener('click', () => {
      navPurchase.classList.add('active');
      navReturn.classList.remove('active');
      form.style.display = 'block';
      returnForm.style.display = 'none';
      msg.textContent = '';
    });

    navReturn.addEventListener('click', () => {
      navReturn.classList.add('active');
      navPurchase.classList.remove('active');
      returnForm.style.display = 'block';
      form.style.display = 'none';
      msg.textContent = '';
    });

    // ✅ Purchase form submit
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const cylinders = document.getElementById('cylinders').value;
      try {
        const res = await fetch('/supplier/purchase', {
          method: 'POST',
          headers: { "Content-Type": 'application/json' },
          body: JSON.stringify({ cylinders })
        });
        const data = await res.json();
        msg.textContent = data.message;
        form.reset();
        loadOrders();
      } catch (err) {
        msg.textContent = "Error submitting purchase";
      }
    });

    // Return form submit
    returnForm.addEventListener('submit', async e => {
      e.preventDefault();
      const blankCylinders = document.getElementById('blankCylinders').value;
      try {
        const res = await fetch('/supplier/return', {
          method: 'POST',
          headers: { "Content-Type": 'application/json' },
          body: JSON.stringify({ blankCylinders })
        });
        const data = await res.json();
        msg.textContent = data.message;
        returnForm.reset();
        loadOrders();
      } catch (err) {
        msg.textContent = "Error submitting return";
      }
    });

    // Load all orders
    async function loadOrders() {
      const res = await fetch('/supplier/myOrders');
      const orders = await res.json();
      myOrders.innerHTML = '';

      orders.forEach(o => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${o.orderId}</td>
          <td>${o.cylinders}</td>
          <td>${o.blankCylindersReturned}</td>
          <td>${o.adminStatus}</td>
          <td>${o.supplierStatus}</td>
          <td>
            ${o.adminStatus === 'sent' && o.supplierStatus === 'pending'
              ? `<input type="number" id="return_${o._id}" placeholder="Blank Cylinders" min="0">
                 <button class="confirm-btn" data-id="${o._id}">Confirm Received</button>`
              : '-'}
          </td>`;
        myOrders.appendChild(row);
      });
    }

    // ✅ Handle Confirm buttons dynamically
    myOrders.addEventListener('click', async e => {
      if (e.target.classList.contains('confirm-btn')) {
        const id = e.target.dataset.id;
        const returned = document.getElementById(`return_${id}`).value || 0;
        await fetch(`/supplier/confirm/${id}`, {
          method: 'POST',
          headers: { "Content-Type": 'application/json' },
          body: JSON.stringify({ blankCylindersReturned: returned })
        });
        loadOrders();
      }
    });

    loadOrders();