FactoryBot.define do
  factory :employee do
    sequence(:full_name) { |n| "Employee #{n}" }
    sequence(:email) { |n| "employee#{n}@example.com" }
    job_title { "Software Engineer" }
    country { "Germany" }
    department { "Engineering" }
    salary { 90_000 }
    hire_date { Date.new(2020, 1, 15) }
  end
end
