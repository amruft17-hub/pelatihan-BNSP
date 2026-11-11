
import { useState } from 'react';
import { z } from 'zod';
import './AddMemberForm.css';

// Schema validasi Zod
const memberSchema = z.object({
  name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  role: z.string().min(1, 'Wajib memilih salah satu peran tim'),
});

function AddMemberForm({ onAddMember }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
  });

  const [errors, setErrors] = useState({});

  // Mengatur perubahan input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validasi dan submit form
  const handleSubmit = (e) => {
    e.preventDefault();

    const result = memberSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};

      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] = issue.message;
      });

      setErrors(fieldErrors);
      return;
    }

    // Tambahkan anggota baru
    onAddMember(result.data);

    // Kosongkan form
    setFormData({
      name: '',
      email: '',
      role: '',
    });

    setErrors({});
  };

  return (
    <div className="add-member-card">

      {/* Header Form */}
      <div className="form-heading">
        <div className="form-icon">+</div>

        <div className="form-heading-text">
          <h3>Tambah Anggota Tim</h3>
          <p>
            Lengkapi informasi anggota baru di bawah ini.
          </p>
        </div>
      </div>

      {/* Form Input */}
      <form
        className="add-member-form"
        onSubmit={handleSubmit}
      >

        {/* Nama Lengkap */}
        <div className="form-group">
          <label htmlFor="name">
            Nama Lengkap
          </label>

          <input
            type="text"
            id="name"
            name="name"
            placeholder="Masukkan nama lengkap"
            value={formData.name}
            onChange={handleChange}
          />

          {errors.name && (
            <span className="error-message">
              ⚠️ {errors.name}
            </span>
          )}
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">
            Email Perusahaan
          </label>

          <input
            type="email"
            id="email"
            name="email"
            placeholder="contoh@email.com"
            value={formData.email}
            onChange={handleChange}
          />

          {errors.email && (
            <span className="error-message">
              ⚠️ {errors.email}
            </span>
          )}
        </div>

        {/* Posisi Tim */}
        <div className="form-group full-width">
          <label htmlFor="role">
            Posisi / Peran Tim
          </label>

          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="">
              -- Pilih Posisi Tim --
            </option>

            <option value="Frontend Dev">
              Frontend Dev
            </option>

            <option value="Backend Engineer">
              Backend Engineer
            </option>

            <option value="UI/UX Designer">
              UI/UX Designer
            </option>
          </select>

          {errors.role && (
            <span className="error-message">
              ⚠️ {errors.role}
            </span>
          )}
        </div>

        {/* Tombol Submit */}
        <button
          type="submit"
          className="submit-button"
        >
          + Tambah Anggota
        </button>

      </form>
    </div>
  );
}

export default AddMemberForm;
