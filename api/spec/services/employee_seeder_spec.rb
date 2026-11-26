require "rails_helper"

RSpec.describe EmployeeSeeder do
  let(:first_names_path) { file_fixture("first_names.txt") }
  let(:last_names_path) { file_fixture("last_names.txt") }

  def seeder(count: 200, **paths)
    described_class.new(count:, first_names_path:, last_names_path:, **paths)
  end

  it "inserts the requested number of employees" do
    expect(seeder.call).to eq(200)
    expect(Employee.count).to eq(200)
  end

  it "seeds 10,000 employees by default" do
    described_class.new(first_names_path:, last_names_path:).call

    expect(Employee.count).to eq(10_000)
  end

  it "builds full names from the cleaned name files" do
    seeder.call
    full_names = Employee.pluck(:full_name)

    expect(full_names).to all(match(/\A(Ada|Grace|Alan|José) (Lovelace|Hopper|Turing|O'Brien)\z/))
    expect(full_names.map { |name| name.split.first }.uniq).to match_array(%w[Ada Grace Alan José])
  end

  it "only builds rows that pass the model validations" do
    invalid = seeder.rows.reject { |row| Employee.new(row).valid? }

    expect(invalid).to be_empty
    expect(seeder.rows.pluck(:email)).to eq(seeder.rows.pluck(:email).uniq)
  end

  it "produces the same rows on every run" do
    expect(seeder.rows).to eq(seeder.rows)
  end

  it "replaces existing employees instead of adding to them" do
    create(:employee)

    2.times { seeder.call }

    expect(Employee.count).to eq(200)
  end

  it "raises and keeps existing employees when a names file is missing" do
    create(:employee)

    expect { seeder(first_names_path: "missing.txt").call }
      .to raise_error(EmployeeSeeder::Error, /Names file not found: missing.txt/)
    expect(Employee.count).to eq(1)
  end

  it "raises when a names file has no names" do
    empty_file = Tempfile.new("names").tap(&:close)

    expect { seeder(last_names_path: empty_file.path).rows }.to raise_error(EmployeeSeeder::Error, /empty/)
  end
end
