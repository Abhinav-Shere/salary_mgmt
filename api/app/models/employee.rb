class Employee < ApplicationRecord
  COUNTRIES = [
    "Australia", "Brazil", "Canada", "France", "Germany",
    "India", "Japan", "Singapore", "United Kingdom", "United States"
  ].freeze
  DEPARTMENTS = [ "Engineering", "Finance", "Human Resources", "Marketing", "Operations", "Sales" ].freeze
  MAX_SALARY = 10_000_000
  API_ATTRIBUTES = %w[id full_name job_title country department salary email hire_date].freeze

  normalizes :full_name, :job_title, with: ->(value) { value.squish }
  normalizes :email, with: ->(value) { value.strip.downcase }

  validates :full_name, presence: true, length: { maximum: 120 }
  validates :job_title, presence: true, length: { maximum: 100 }
  validates :country, presence: true, inclusion: { in: COUNTRIES, allow_blank: true }
  validates :department, presence: true, inclusion: { in: DEPARTMENTS, allow_blank: true }
  validates :salary, presence: true,
    numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: MAX_SALARY, allow_nil: true }
  validates :email, presence: true, uniqueness: true,
    format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true }
  validates :hire_date, presence: true,
    comparison: { less_than_or_equal_to: -> { Date.current }, message: "can't be in the future", allow_nil: true }

  scope :name_contains, ->(query) { where("full_name LIKE ?", "%#{sanitize_sql_like(query)}%") }

  def self.filtered(query: nil, country: nil, job_title: nil)
    employees = all
    employees = employees.name_contains(query) if query.present?
    employees = employees.where(country:) if country.present?
    employees = employees.where(job_title:) if job_title.present?
    employees
  end

  def serializable_hash(options = nil)
    super({ only: API_ATTRIBUTES }.merge(options || {}))
  end
end
