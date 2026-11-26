require "rails_helper"

RSpec.describe Employee do
  def errors_for(attribute, **attributes)
    employee = build(:employee, **attributes)
    employee.validate
    employee.errors[attribute]
  end

  it "is valid with the factory attributes" do
    expect(build(:employee)).to be_valid
  end

  it "requires every field" do
    employee = described_class.new
    employee.validate

    expect(employee.errors.attribute_names).to contain_exactly(
      :full_name, :job_title, :country, :department, :salary, :email, :hire_date
    )
  end

  describe "full_name and job_title" do
    it "squishes surrounding and repeated whitespace" do
      employee = build(:employee, full_name: "  Ada   Lovelace ", job_title: " Data   Analyst ")

      expect(employee).to have_attributes(full_name: "Ada Lovelace", job_title: "Data Analyst")
    end

    it "limits their length" do
      expect(errors_for(:full_name, full_name: "a" * 121)).to include("is too long (maximum is 120 characters)")
      expect(errors_for(:job_title, job_title: "a" * 101)).to include("is too long (maximum is 100 characters)")
    end
  end

  describe "country and department" do
    it "accept only known values" do
      expect(errors_for(:country, country: "Atlantis")).to eq([ "is not included in the list" ])
      expect(errors_for(:department, department: "Legal")).to eq([ "is not included in the list" ])
    end

    it "report a single error when blank" do
      expect(errors_for(:country, country: "")).to eq([ "can't be blank" ])
    end
  end

  describe "salary" do
    it "must be a positive whole number" do
      expect(errors_for(:salary, salary: 0)).to eq([ "must be greater than 0" ])
      expect(errors_for(:salary, salary: 1500.5)).to eq([ "must be an integer" ])
      expect(errors_for(:salary, salary: "lots")).to eq([ "is not a number" ])
    end

    it "has an upper bound" do
      expect(errors_for(:salary, salary: Employee::MAX_SALARY)).to be_empty
      expect(errors_for(:salary, salary: Employee::MAX_SALARY + 1)).to eq([ "must be less than or equal to 10000000" ])
    end
  end

  describe "email" do
    it "is stored stripped and lowercased" do
      expect(build(:employee, email: "  Ada.Lovelace@Example.COM ").email).to eq("ada.lovelace@example.com")
    end

    it "must look like an email address" do
      expect(errors_for(:email, email: "not-an-email")).to eq([ "is invalid" ])
    end

    it "is unique regardless of case" do
      create(:employee, email: "ada@example.com")

      expect(errors_for(:email, email: "ADA@example.com")).to eq([ "has already been taken" ])
    end
  end

  describe "hire_date" do
    it "can be today but not in the future" do
      expect(errors_for(:hire_date, hire_date: Date.current)).to be_empty
      expect(errors_for(:hire_date, hire_date: Date.current + 1)).to eq([ "can't be in the future" ])
    end
  end

  describe ".filtered" do
    let!(:ada) { create(:employee, full_name: "Ada Lovelace", country: "United Kingdom", job_title: "Engineer") }
    let!(:grace) { create(:employee, full_name: "Grace Hopper", country: "United States", job_title: "Engineer") }
    let!(:alan) { create(:employee, full_name: "Alan Turing", country: "United Kingdom", job_title: "Researcher") }

    it "returns everyone without filters" do
      expect(described_class.filtered).to contain_exactly(ada, grace, alan)
    end

    it "matches part of the name case-insensitively" do
      expect(described_class.filtered(query: "LOVE")).to contain_exactly(ada)
    end

    it "treats LIKE wildcards in the query literally" do
      expect(described_class.filtered(query: "%")).to be_empty
    end

    it "combines country and job title filters" do
      expect(described_class.filtered(country: "United Kingdom")).to contain_exactly(ada, alan)
      expect(described_class.filtered(country: "United Kingdom", job_title: "Engineer")).to contain_exactly(ada)
    end
  end

  it "serializes only the API attributes" do
    expect(build(:employee).as_json.keys).to match_array(Employee::API_ATTRIBUTES)
  end
end
