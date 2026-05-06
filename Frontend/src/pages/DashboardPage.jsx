import React, { Component } from "react";
import { contributionService } from "../services/contributionService";
import { groupService } from "../services/groupService";
import { loanService } from "../services/loanService";
import { memberService } from "../services/memberService";

class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: {
        totalMembers: 0,
        totalGroups: 0,
        totalContributions: 0,
        totalLoans: 0
      },
      loading: true
    };
  }

  componentDidMount() {
    this.fetchDashboardData();
  }

  fetchDashboardData = async () => {
    try {
      const [members, groups, contributions, loans] = await Promise.all([
        memberService.getAllMembers(),
        groupService.getAllGroups(),
        contributionService.getAllContributions(),
        loanService.getAllLoans()
      ]);

      this.setState({
        stats: {
          totalMembers: members.data?.length || 0,
          totalGroups: groups.data?.length || 0,
          totalContributions: contributions.data?.length || 0,
          totalLoans: loans.data?.length || 0
        },
        loading: false
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      this.setState({ loading: false });
    }
  };

  render() {
    const { stats, loading } = this.state;

    if (loading) {
      return <div style={{ padding: "40px", textAlign: "center" }}>Loading dashboard...</div>;
    }

    return (
      <div style={{ padding: "20px" }}>
        <h1>Dashboard</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginTop: "20px" }}>
          <div style={{ padding: "20px", backgroundColor: "#007bff", color: "white", borderRadius: "8px" }}>
            <h3>Total Members</h3>
            <p style={{ fontSize: "32px", margin: "10px 0" }}>{stats.totalMembers}</p>
          </div>
          <div style={{ padding: "20px", backgroundColor: "#28a745", color: "white", borderRadius: "8px" }}>
            <h3>Total Groups</h3>
            <p style={{ fontSize: "32px", margin: "10px 0" }}>{stats.totalGroups}</p>
          </div>
          <div style={{ padding: "20px", backgroundColor: "#ffc107", color: "#333", borderRadius: "8px" }}>
            <h3>Total Contributions</h3>
            <p style={{ fontSize: "32px", margin: "10px 0" }}>{stats.totalContributions}</p>
          </div>
          <div style={{ padding: "20px", backgroundColor: "#dc3545", color: "white", borderRadius: "8px" }}>
            <h3>Total Loans</h3>
            <p style={{ fontSize: "32px", margin: "10px 0" }}>{stats.totalLoans}</p>
          </div>
        </div>
      </div>
    );
  }
}

export default DashboardPage;
