import React, { useState } from 'react';

const Waitlist = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    referredBy: '',
    referredEmails: [''],
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleReferredEmailChange = (idx, value) => {
    const updated = [...form.referredEmails];
    updated[idx] = value;
    setForm({ ...form, referredEmails: updated });
  };

  const addReferredEmail = () => {
    setForm({ ...form, referredEmails: [...form.referredEmails, ''] });
  };

  const removeReferredEmail = (idx) => {
    setForm({ ...form, referredEmails: form.referredEmails.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage('Successfully joined the waitlist!');
        setForm({
          name: '',
          email: '',
          referredBy: '',
          referredEmails: [''],
        });
      } else {
        const data = await res.json();
        setMessage(data.error || 'Submission failed.');
      }
    } catch (err) {
      setMessage('Network error.');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-14 p-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-7 text-center">Join the Waitlist</h2>
      {message && <div className="mb-4 p-3 bg-blue-100 text-blue-900 rounded">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full mt-1 border px-3 py-2 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full mt-1 border px-3 py-2 rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium">Who referred you?</label>
          <input
            type="text"
            name="referredBy"
            value={form.referredBy}
            onChange={handleChange}
            className="w-full mt-1 border px-3 py-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium">Refer others (add emails)</label>
          {form.referredEmails.map((email, idx) => (
            <div className="flex gap-2 mb-2" key={idx}>
              <input
                type="email"
                value={email}
                onChange={e => handleReferredEmailChange(idx, e.target.value)}
                className="flex-1 border px-3 py-2 rounded"
                placeholder="Referral email"
              />
              {form.referredEmails.length > 1 && (
                <button type="button" className="text-red-500" onClick={() => removeReferredEmail(idx)}>Remove</button>
              )}
            </div>
          ))}
          <button type="button" className="text-blue-600 mt-1" onClick={addReferredEmail}>
            + Add another email
          </button>
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-green-600 text-white rounded font-semibold"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Join Waitlist'}
        </button>
      </form>
    </div>
  );
};

export default Waitlist;