import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 

const httpOptions =
{
  headers: new HttpHeaders({ 'Content-Type' : 'application/json'})
};

const BACKEND_URL = 'http://localhost:3000';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit {
  public groupNames: string[] = [];
  public isAllowedToCreateGroup: boolean = false; // Initially set to false
  public isModalOpen: boolean = false;
  public pendingInterests: any[] = [];
  public selectedGroupName: string | null = null; 
  public channelsForSelectedGroup: string[] = [];

  createGroupForm: FormGroup = this.fb.group({
    groupName: ['']
  });

  constructor(private http: HttpClient, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadExistingGroups();
    this.loadPendingInterests();

    const userRoles = JSON.parse(localStorage.getItem('roles') || '[]');
    if (userRoles.includes('Super') || userRoles.includes('Group')) {
      this.isAllowedToCreateGroup = true;
    }
  }

  loadExistingGroups(): void {
    this.http.get<string[]>(BACKEND_URL + '/api/auth/getGroups',httpOptions) 
      .subscribe({
        next: (data) => {
          this.groupNames = data;
        },
        error: (error) => {
          console.error('Error fetching groups:', error);
        }
      });
  }

  openCreateGroupModal(): void {
    this.isModalOpen = true;
  }

  closeCreateGroupModal(): void {
    this.isModalOpen = false;
  }

  createGroup(): void {
  const groupNameControl = this.createGroupForm.get('groupName');

  if (groupNameControl) {
    const groupName = groupNameControl.value;
    if (groupName) {
      this.http.post<any[]>(BACKEND_URL + '/api/auth/addGroup',  { "groupName": groupName, "channels": [] }, httpOptions)
        .subscribe({
          next: (data) => {
            // Ensuring we only take the groupNames from the data
            this.groupNames = data.map(group => group.groupName);
            groupNameControl.setValue('');
          },
          error: (error) => {
            console.error('Error creating group:', error);
          },
        });
    }
  }
}

//register interest in a group - event: to prevent page navigating to account automatically
  registerInterest(event: Event, groupName: string): void {
    event.preventDefault();

     const username = localStorage.getItem('username');

    if (!username) {
      console.error('No username found');
      return;
    }

    console.log("registerInterest called with:", groupName);

    this.http.post(`${BACKEND_URL}/api/auth/registerInterest`, { username, groupName }, httpOptions)
      .subscribe({
        next: (data) => {
          alert("Interest registered!");
          console.log('Interest registered:', data);
        },
        error: (error) => {
          console.error('Error:', error);
        }
      });
  }


// Pending requests - only super and group user can see
  loadPendingInterests(): void {
    this.http.get<any[]>(BACKEND_URL + '/api/auth/pendingInterest')
        .subscribe({
            next: (data) => {
                this.pendingInterests = data;
            },
            error: (error) => {
                console.error('Error fetching pending interests:', error);
            },
        });
}

// confirm
    confirmInterest(username: string, groupName: string): void {
  this.http.post(`${BACKEND_URL}/api/auth/confirmInterest`, { username, groupName }, httpOptions)
    .subscribe({
      next: (data) => {
        console.log('Interest confirmed:', data);
        this.loadPendingInterests(); // Refresh list
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
}
//stops navigating to app page when clicked
onGroupNameClick(event: Event, groupName: string): void {
    event.preventDefault();
    console.log("Group name clicked:", groupName, );
    this.selectGroup(groupName);
}

selectGroup(groupName: string): void {
    const username = localStorage.getItem('username');
    if (!username) {
      console.error("Username not found in local storage");
      return;
    }
    console.log('Requesting channels for:', { groupName, username });

    this.http.post<string[]>(`${BACKEND_URL}/api/auth/getChannels`, { groupName, username }, httpOptions)
  .subscribe({
    next: (channels) => {
      console.log('Received channels:', channels);  // Step 4
      this.channelsForSelectedGroup = channels;
    },
    error: (error) => {
      console.error('Error fetching channels:', error);
      if (error.status === 403) {  
        alert("You need to register to this group!");
      }
    }
  });}}
