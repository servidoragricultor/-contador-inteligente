# Modelo de datos inicial

Este modelo es conceptual. La implementacion puede ajustar nombres segun el stack tecnico.

## User

- id.
- name.
- email.
- password_hash.
- global_role.
- created_at.

## Company

- id.
- legal_name.
- trade_name.
- rfc.
- tax_regime.
- postal_code.
- created_by_user_id.
- created_at.

## CompanyMember

- id.
- company_id.
- user_id.
- role: accountant o client.
- status: active o invited.
- invited_at.
- accepted_at.

## Transaction

Entidad unica para ingresos y gastos.

- id.
- company_id.
- type: income o expense.
- source: manual o xml.
- date.
- description.
- counterparty_name.
- counterparty_rfc.
- category_id.
- subtotal.
- tax_amount.
- withholding_amount.
- total.
- currency.
- payment_status: paid, collected, pending o cancelled.
- review_status: unreviewed, reviewed o correction_required.
- created_by_user_id.
- created_at.

## FiscalDocument

- id.
- company_id.
- transaction_id.
- uuid.
- folio.
- issuer_rfc.
- issuer_name.
- receiver_rfc.
- receiver_name.
- issue_date.
- subtotal.
- tax_amount.
- total.
- currency.
- payment_method.
- payment_form.
- xml_file_path.
- created_at.

## Category

- id.
- company_id opcional.
- name.
- type: income, expense o both.
- is_default.
